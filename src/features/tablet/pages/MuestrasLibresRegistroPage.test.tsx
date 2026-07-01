import { screen } from '@testing-library/react';
import { renderWithAuth } from '../../../test/render';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MuestrasLibresRegistroPage } from './MuestrasLibresRegistroPage';
import { useMuestrasLibresContext } from '../context/MuestrasLibresContext';
import { useBalanzaWebSocket } from '../hooks/useBalanzaWebSocket';
import type { User } from '../../../shared/types/auth';
import type { Muestra } from '../../../shared/types/domain';

vi.mock('../context/MuestrasLibresContext', () => ({
  useMuestrasLibresContext: vi.fn(),
}));

vi.mock('../hooks/useBalanzaWebSocket', () => ({
  useBalanzaWebSocket: vi.fn(),
}));

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

const addSampleMock = vi.fn().mockResolvedValue(undefined);
const removeSampleMock = vi.fn().mockResolvedValue(undefined);
const updateSampleMock = vi.fn().mockResolvedValue(undefined);
const setSelectedEtapaIdMock = vi.fn();

const mockContextValue = {
  muestras: [],
  etapas: [],
  addSample: addSampleMock,
  removeSample: removeSampleMock,
  updateSample: updateSampleMock,
  clearSession: vi.fn(),
  isRegistering: false,
  selectedEtapaId: 10,
  setSelectedEtapaId: setSelectedEtapaIdMock,
};

const operarioUser: User = {
  id: 3,
  legajo: 'O1',
  nombreUsuario: 'operario1',
  rol: 'operario',
  puedeTomarMuestrasLibres: true,
};

const sampleMuestra: Muestra = {
  id: 1,
  pesoNeto: 12.345,
  estadoValidacion: 'ok',
  usuarioId: 3,
  etapaId: 10,
  lineaProduccionId: 1,
  timestamp: '2026-06-30T10:00:00Z',
  observacion: '',
};

describe('MuestrasLibresRegistroPage', () => {
  beforeEach(() => {
    navigateMock.mockClear();
    addSampleMock.mockClear();
    removeSampleMock.mockClear();
    updateSampleMock.mockClear();
    setSelectedEtapaIdMock.mockClear();
    vi.mocked(useMuestrasLibresContext).mockReturnValue({ ...mockContextValue, muestras: [] });
    vi.mocked(useBalanzaWebSocket).mockReturnValue({ pesoNeto: 12.345, isConnected: true });
  });

  it('renders the weight display', () => {
    renderWithAuth(<MuestrasLibresRegistroPage />, { user: operarioUser, activeLineaId: 1 });
    expect(screen.getByText('12.345')).toBeInTheDocument();
  });

  it('"Registrar muestra" button is disabled when isConnected is false', () => {
    vi.mocked(useBalanzaWebSocket).mockReturnValue({ pesoNeto: 0, isConnected: false });
    renderWithAuth(<MuestrasLibresRegistroPage />, { user: operarioUser, activeLineaId: 1 });
    const btn = screen.getByRole('button', { name: /registrar muestra/i });
    expect(btn).toBeDisabled();
  });

  it('"Registrar muestra" button is disabled when isRegistering is true', () => {
    vi.mocked(useMuestrasLibresContext).mockReturnValue({ ...mockContextValue, isRegistering: true });
    renderWithAuth(<MuestrasLibresRegistroPage />, { user: operarioUser, activeLineaId: 1 });
    const btn = screen.getByRole('button', { name: /registrar muestra/i });
    expect(btn).toBeDisabled();
  });

  it('clicking "Registrar muestra" calls addSample with current pesoNeto', async () => {
    renderWithAuth(<MuestrasLibresRegistroPage />, { user: operarioUser, activeLineaId: 1 });
    const btn = screen.getByRole('button', { name: /registrar muestra/i });
    await userEvent.click(btn);
    expect(addSampleMock).toHaveBeenCalledWith(12.345);
  });

  it('"Finalizar" button is always rendered', () => {
    renderWithAuth(<MuestrasLibresRegistroPage />, { user: operarioUser, activeLineaId: 1 });
    expect(screen.getByRole('button', { name: /finalizar/i })).toBeInTheDocument();
  });

  it('clicking "Finalizar" navigates to /tablet/pasadas', async () => {
    renderWithAuth(<MuestrasLibresRegistroPage />, { user: operarioUser, activeLineaId: 1 });
    const btn = screen.getByRole('button', { name: /finalizar/i });
    await userEvent.click(btn);
    expect(navigateMock).toHaveBeenCalledWith('/tablet/pasadas');
  });

  it('renders MuestrasListPanel (shows empty message when no muestras)', () => {
    renderWithAuth(<MuestrasLibresRegistroPage />, { user: operarioUser, activeLineaId: 1 });
    // MuestrasListPanel renders empty message when muestras is []
    expect(screen.getByText(/no hay muestras/i)).toBeInTheDocument();
  });

  // ── MuestraObservacionPopup integration (task 3.3) ───────────────────────────

  it('clicking a sample row opens the MuestraObservacionPopup', async () => {
    vi.mocked(useMuestrasLibresContext).mockReturnValue({
      ...mockContextValue,
      muestras: [sampleMuestra],
    });
    renderWithAuth(<MuestrasLibresRegistroPage />, { user: operarioUser, activeLineaId: 1 });

    // The row is rendered as a button in MuestrasListPanel; click it
    const row = screen.getByRole('button', { name: /#1/i });
    await userEvent.click(row);

    // Popup opens showing the sample number
    expect(await screen.findByText(/Muestra #1/)).toBeInTheDocument();
  });

  it('does not render an inline delete (Eliminar muestra) button on rows', async () => {
    vi.mocked(useMuestrasLibresContext).mockReturnValue({
      ...mockContextValue,
      muestras: [sampleMuestra],
    });
    renderWithAuth(<MuestrasLibresRegistroPage />, { user: operarioUser, activeLineaId: 1 });

    expect(screen.queryAllByRole('button', { name: /eliminar muestra/i })).toHaveLength(0);
  });
});
