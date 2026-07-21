import { screen } from '@testing-library/react';
import { renderWithAuth } from '../../../test/render';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MuestrasLibresPage } from './MuestrasLibresPage';
import { useMuestrasLibresContext } from '../context/MuestrasLibresContext';
import { useBalanzaWebSocket } from '../hooks/useBalanzaWebSocket';
import { getLinea } from '../../../api/lineas';
import type { User } from '../../../shared/types/auth';
import type { Muestra, RutaPasadaEtapa } from '../../../shared/types/domain';

vi.mock('../context/MuestrasLibresContext', () => ({
  useMuestrasLibresContext: vi.fn(),
}));

vi.mock('../hooks/useBalanzaWebSocket', () => ({
  useBalanzaWebSocket: vi.fn(),
}));

vi.mock('../../../api/lineas', () => ({
  getLinea: vi.fn(),
}));

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

const addSampleMock = vi.fn().mockResolvedValue(undefined);
const removeSampleMock = vi.fn().mockResolvedValue(undefined);
const updateSampleMock = vi.fn().mockResolvedValue(undefined);
const setSelectedEtapaIdMock = vi.fn();

const etapaAmasado: RutaPasadaEtapa = {
  id: 1,
  etapa: { id: 10, nombre: 'Amasado' },
  orden: 1,
  pesoMinimo: 10,
  pesoIdeal: 15,
  pesoMaximo: 20,
  cantidadMuestrasRequeridas: 2,
};

const etapaHorneado: RutaPasadaEtapa = {
  id: 2,
  etapa: { id: 20, nombre: 'Horneado' },
  orden: 2,
  pesoMinimo: 30,
  pesoIdeal: 35,
  pesoMaximo: 40,
  cantidadMuestrasRequeridas: 1,
};

const sampleEtapas = [etapaAmasado, etapaHorneado];

const makeMuestra = (overrides: Partial<Muestra> = {}): Muestra => ({
  id: 1,
  pesoNeto: 15.0,
  estadoValidacion: 'ok',
  usuarioId: 3,
  etapaId: 10,
  lineaProduccionId: 1,
  timestamp: new Date().toISOString(),
  observacion: '',
  ...overrides,
});

const baseContextValue = {
  muestras: [] as Muestra[],
  etapas: sampleEtapas,
  selectedEtapaId: 10,
  selectedEtapa: etapaAmasado,
  setSelectedEtapaId: setSelectedEtapaIdMock,
  addSample: addSampleMock,
  updateSample: updateSampleMock,
  removeSample: removeSampleMock,
  clearSession: vi.fn(),
  isRegistering: false,
};

const operarioUser: User = {
  id: 3,
  legajo: 'O1',
  nombreUsuario: 'operario1',
  rol: 'operario',
  puedeTomarMuestrasLibres: true,
};

const lineaConRuta = {
  id: 1,
  nombre: 'Línea 1',
  numeroBalanza: 1,
  activo: true,
  rutaPasadaActiva: { id: 10, nombre: 'Ruta A', etapas: sampleEtapas },
};

describe('MuestrasLibresPage', () => {
  beforeEach(() => {
    navigateMock.mockClear();
    addSampleMock.mockClear();
    removeSampleMock.mockClear();
    updateSampleMock.mockClear();
    setSelectedEtapaIdMock.mockClear();
    vi.mocked(useMuestrasLibresContext).mockReturnValue({ ...baseContextValue });
    vi.mocked(useBalanzaWebSocket).mockReturnValue({ pesoNeto: 12.345, isConnected: true });
    vi.mocked(getLinea).mockResolvedValue(lineaConRuta as never);
  });

  it('renders the amber "MUESTRAS LIBRES" pill in the topbar', async () => {
    renderWithAuth(<MuestrasLibresPage />, { user: operarioUser, activeLineaId: 1 });
    const pill = await screen.findByText('MUESTRAS LIBRES');
    expect(pill).toBeInTheDocument();
    expect(pill.className).toMatch(/border-warning/);
  });

  it('renders one pill per etapa and marks the default (lowest orden) selected', () => {
    renderWithAuth(<MuestrasLibresPage />, { user: operarioUser, activeLineaId: 1 });
    const amasado = screen.getByRole('button', { name: 'Amasado' });
    const horneado = screen.getByRole('button', { name: 'Horneado' });
    expect(amasado.className).toMatch(/bg-warning/);
    expect(horneado.className).not.toMatch(/bg-warning border-warning/);
  });

  it('every etapa pill is clickable at any time (no locking)', async () => {
    renderWithAuth(<MuestrasLibresPage />, { user: operarioUser, activeLineaId: 1 });
    await userEvent.click(screen.getByRole('button', { name: 'Horneado' }));
    expect(setSelectedEtapaIdMock).toHaveBeenCalledWith(20);
  });

  it('switching etapa updates the ToleranceDisplay tolerance values', () => {
    vi.mocked(useMuestrasLibresContext).mockReturnValue({
      ...baseContextValue,
      selectedEtapaId: 20,
      selectedEtapa: etapaHorneado,
    });
    renderWithAuth(<MuestrasLibresPage />, { user: operarioUser, activeLineaId: 1 });
    expect(screen.getByText('30.000 kg')).toBeInTheDocument();
    expect(screen.getByText('35.000 kg')).toBeInTheDocument();
    expect(screen.getByText('40.000 kg')).toBeInTheDocument();
  });

  it('filters the samples panel to the currently-selected etapa', () => {
    vi.mocked(useMuestrasLibresContext).mockReturnValue({
      ...baseContextValue,
      muestras: [
        makeMuestra({ id: 1, etapaId: 10, pesoNeto: 1 }),
        makeMuestra({ id: 2, etapaId: 20, pesoNeto: 2 }),
        makeMuestra({ id: 3, etapaId: 10, pesoNeto: 3 }),
      ],
    });
    renderWithAuth(<MuestrasLibresPage />, { user: operarioUser, activeLineaId: 1 });
    // Only the 2 samples for etapa 10 (selected) are shown.
    expect(screen.getByText('1.000 kg')).toBeInTheDocument();
    expect(screen.getByText('3.000 kg')).toBeInTheDocument();
    expect(screen.queryByText('2.000 kg')).not.toBeInTheDocument();
  });

  it('shows the empty-state message when the selected etapa has zero samples', () => {
    renderWithAuth(<MuestrasLibresPage />, { user: operarioUser, activeLineaId: 1 });
    expect(screen.getByText('Sin muestras registradas para esta etapa')).toBeInTheDocument();
  });

  it('registering a sample calls addSample with the current pesoNeto', async () => {
    renderWithAuth(<MuestrasLibresPage />, { user: operarioUser, activeLineaId: 1 });
    await userEvent.click(screen.getByRole('button', { name: /registrar muestra de calidad/i }));
    expect(addSampleMock).toHaveBeenCalledWith(12.345);
  });

  it('clicking a sample row then Eliminar removes the CORRECT original-indexed sample after filtering (highest design risk)', async () => {
    vi.mocked(useMuestrasLibresContext).mockReturnValue({
      ...baseContextValue,
      muestras: [
        makeMuestra({ id: 1, etapaId: 10, pesoNeto: 1 }),
        makeMuestra({ id: 2, etapaId: 20, pesoNeto: 2 }),
        makeMuestra({ id: 3, etapaId: 10, pesoNeto: 3 }),
        makeMuestra({ id: 4, etapaId: 20, pesoNeto: 4 }),
      ],
    });
    renderWithAuth(<MuestrasLibresPage />, { user: operarioUser, activeLineaId: 1 });

    // Filtered list for etapa 10 (selected) shows samples #1 (pesoNeto 1) and #2 (pesoNeto 3),
    // whose ORIGINAL indices are 0 and 2 respectively. Click the 2nd filtered row.
    const row = screen.getByText('3.000 kg').closest('button')!;
    await userEvent.click(row);

    const deleteBtn = await screen.findByRole('button', { name: /eliminar muestra/i });
    await userEvent.click(deleteBtn);
    const confirmBtn = await screen.findByRole('button', { name: 'Eliminar' });
    await userEvent.click(confirmBtn);

    // Original index of pesoNeto=3 sample is 2, NOT its filtered-index 1.
    expect(removeSampleMock).toHaveBeenCalledWith(2);
  });

  it('the Finalizar button is always visible, clears the session and navigates without confirmation', async () => {
    const clearSessionMock = vi.fn();
    vi.mocked(useMuestrasLibresContext).mockReturnValue({ ...baseContextValue, clearSession: clearSessionMock });
    renderWithAuth(<MuestrasLibresPage />, { user: operarioUser, activeLineaId: 1 });
    const btn = screen.getByRole('button', { name: /finalizar muestras aleatorias/i });
    expect(btn).toBeInTheDocument();
    await userEvent.click(btn);
    expect(clearSessionMock).toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith('/tablet/pasadas');
    // No confirmation dialog should appear.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not render a progress bar / counter', () => {
    renderWithAuth(<MuestrasLibresPage />, { user: operarioUser, activeLineaId: 1 });
    expect(screen.queryByText(/\d+\s*\/\s*\d+/)).not.toBeInTheDocument();
  });

  it('does not render a Volver/back button', () => {
    renderWithAuth(<MuestrasLibresPage />, { user: operarioUser, activeLineaId: 1 });
    expect(screen.queryByRole('button', { name: /volver/i })).not.toBeInTheDocument();
  });

  it('shows a guard/empty state when there are no etapas (no ruta assigned), without crashing', () => {
    vi.mocked(useMuestrasLibresContext).mockReturnValue({ ...baseContextValue, etapas: [], selectedEtapa: null, selectedEtapaId: null });
    renderWithAuth(<MuestrasLibresPage />, { user: operarioUser, activeLineaId: 1 });
    expect(screen.getByText(/sin ruta de pesaje asignada/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /registrar muestra de calidad/i })).not.toBeInTheDocument();
  });

  // ── Tolerance guard (ux-polish Task 1) ────────────────────────────────────

  it('bloquea el registro y muestra alerta cuando el peso está fuera de tolerancia y el rango es estrecho', async () => {
    // Tight range: pesoMinimo=14, pesoIdeal=15, pesoMaximo=16 (range=2 < 0.4*15=6).
    const etapaTight: RutaPasadaEtapa = {
      id: 1,
      etapa: { id: 10, nombre: 'Amasado' },
      orden: 1,
      pesoMinimo: 14,
      pesoIdeal: 15,
      pesoMaximo: 16,
      cantidadMuestrasRequeridas: 2,
    };

    vi.mocked(useMuestrasLibresContext).mockReturnValue({
      ...baseContextValue,
      etapas: [etapaTight],
      selectedEtapa: etapaTight,
      selectedEtapaId: 10,
    });
    // Far from ideal: pesoNeto=25 → tolerance=10 > threshold=3 → blocked.
    vi.mocked(useBalanzaWebSocket).mockReturnValue({ pesoNeto: 25.0, isConnected: true });

    renderWithAuth(<MuestrasLibresPage />, { user: operarioUser, activeLineaId: 1 });

    const btnRegistrar = screen.getByRole('button', { name: /registrar muestra de calidad/i });
    // Button stays clickable (NOT disabled) — gray appearance, not warning amber.
    expect(btnRegistrar).not.toBeDisabled();
    expect(btnRegistrar.className).not.toContain('bg-warning');
    expect(btnRegistrar.className).toContain('bg-muted');

    await userEvent.click(btnRegistrar);

    // alertWarning popup appears with an Aceptar button.
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toBeInTheDocument();

    // addSample was NOT called — the guard short-circuited.
    expect(addSampleMock).not.toHaveBeenCalled();
  });
});
