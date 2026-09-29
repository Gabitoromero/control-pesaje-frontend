import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { vi, describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { renderWithAuth } from '../../../test/render';
import { MuestrasLibresPage } from './MuestrasLibresPage';
import { useMuestrasLibresContext } from '../context/MuestrasLibresContext';
import { useBalanzaWebSocket } from '../hooks/useBalanzaWebSocket';
import type { User } from '../../../shared/types/auth';
import type { Muestra, RutaPasadaEtapa } from '../../../shared/types/domain';

// Only the context and the websocket are mocked: the REAL useToleranceConfig hook
// talks to the msw backend, proving the page actually requests the tolerance.
vi.mock('../context/MuestrasLibresContext', () => ({
  useMuestrasLibresContext: vi.fn(),
}));

vi.mock('../hooks/useBalanzaWebSocket', () => ({
  useBalanzaWebSocket: vi.fn(),
}));

const BASE = 'http://localhost:3000/api';

const etapaNarrow: RutaPasadaEtapa = {
  id: 1,
  etapa: { id: 10, nombre: 'Amasado' },
  orden: 1,
  pesoMinimo: 14,
  pesoIdeal: 15,
  pesoMaximo: 16,
  cantidadMuestrasRequeridas: 2,
};

const operarioUser: User = {
  id: 3,
  legajo: 'O1',
  nombreUsuario: 'operario1',
  rol: 'operario',
  puedeTomarMuestrasLibres: true,
};

const addSampleMock = vi.fn().mockResolvedValue(undefined);

const tolerancePct = 12.5;
let toleranceRequests = 0;

const server = setupServer(
  http.get(`${BASE}/configuracion/tolerancia`, () => {
    toleranceRequests += 1;
    return HttpResponse.json({
      success: true,
      data: { toleranciaPct: tolerancePct, updatedAt: '2026-09-29T12:00:00.000Z', updatedBy: null },
    });
  }),
  http.get(`${BASE}/lineas-produccion/1`, () =>
    HttpResponse.json({
      success: true,
      data: {
        id: 1,
        nombre: 'Línea 1',
        numeroBalanza: 1,
        activo: true,
        rutaPasadaActiva: { id: 10, nombre: 'Ruta A', etapas: [etapaNarrow] },
      },
    }),
  ),
);

describe('MuestrasLibresPage tolerance (real hook + msw)', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  afterEach(() => {
    server.resetHandlers();
    toleranceRequests = 0;
    addSampleMock.mockClear();
  });
  afterAll(() => server.close());

  it('requests the tolerance from the backend and uses its value (12,5%) for the blocked-weight popup', async () => {
    vi.mocked(useMuestrasLibresContext).mockReturnValue({
      muestras: [] as Muestra[],
      etapas: [etapaNarrow],
      selectedEtapaId: 10,
      selectedEtapa: etapaNarrow,
      setSelectedEtapaId: vi.fn(),
      addSample: addSampleMock,
      updateSample: vi.fn(),
      removeSample: vi.fn(),
      clearSession: vi.fn(),
      isRegistering: false,
    });
    // With 12.5% the limits are [12.25, 18], so 22 is blocked; the popup echoes the backend percentage.
    vi.mocked(useBalanzaWebSocket).mockReturnValue({ pesoNeto: 22, isConnected: true, hardwareId: undefined, unidad: undefined });

    renderWithAuth(<MuestrasLibresPage />, { user: operarioUser, activeLineaId: 1 });

    await waitFor(() => expect(toleranceRequests).toBeGreaterThanOrEqual(1));

    const button = screen.getByRole('button', { name: /registrar muestra de calidad/i });
    await waitFor(() => expect(screen.queryByText('Cargando tolerancia de peso...')).not.toBeInTheDocument());
    await userEvent.click(button);

    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText(/más del 12,5% del rango permitido/)).toBeInTheDocument();
    expect(addSampleMock).not.toHaveBeenCalled();
  });
});
