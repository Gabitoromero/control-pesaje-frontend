import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { renderWithProviders } from '../../../test/render';
import { PasadaCard } from './PasadaCard';
import { getMuestras } from '../../../api/muestras';
import type { Pasada, RutaPasadaEtapa } from '../../../shared/types/domain';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../../../api/muestras', () => ({
  getMuestras: vi.fn(),
}));

const etapas: RutaPasadaEtapa[] = [
  { id: 1, etapa: { id: 10, nombre: 'Recepción' }, orden: 1, pesoMinimo: 1, pesoIdeal: 2, pesoMaximo: 3, cantidadMuestrasRequeridas: 1 },
  { id: 2, etapa: { id: 11, nombre: 'Empaque' }, orden: 2, pesoMinimo: 1, pesoIdeal: 2, pesoMaximo: 3, cantidadMuestrasRequeridas: 1 },
];

const basePasada: Pasada = {
  id: 101,
  estado: 'en_curso',
  articuloId: 1,
  articulo: { id: 1, nombre: 'Articulo A', marca: 'Marca X' },
  horaInicio: '2026-07-07T13:05:00.000Z',
};

describe('PasadaCard', () => {
  beforeEach(() => {
    navigateMock.mockClear();
    vi.mocked(getMuestras).mockReset();
    vi.mocked(getMuestras).mockResolvedValue([]);
  });

  it('renders pasada number, article name and start time', async () => {
    renderWithProviders(<PasadaCard pasada={basePasada} etapas={etapas} />);

    expect(await screen.findByText('Pasada #101')).toBeInTheDocument();
    expect(screen.getByText('Marca X - Articulo A')).toBeInTheDocument();
  });

  it('renders stage progress meta line using deriveStageProgress data', async () => {
    renderWithProviders(<PasadaCard pasada={basePasada} etapas={etapas} />);

    expect(await screen.findByText(/Avance: Etapa 1 de 2/)).toBeInTheDocument();
  });

  it('renders the StagePillRow', async () => {
    renderWithProviders(<PasadaCard pasada={basePasada} etapas={etapas} />);

    expect(await screen.findByTestId('stage-pill-row')).toBeInTheDocument();
  });

  it('fetches muestras for this pasada using the shared query key', async () => {
    renderWithProviders(<PasadaCard pasada={basePasada} etapas={etapas} />);

    await screen.findByText('Pasada #101');
    expect(getMuestras).toHaveBeenCalledWith(101);
  });

  it('navigates to the workspace when Continuar is clicked', async () => {
    renderWithProviders(<PasadaCard pasada={basePasada} etapas={etapas} />);

    const btnContinuar = await screen.findByRole('button', { name: /continuar/i });
    await userEvent.click(btnContinuar);

    expect(navigateMock).toHaveBeenCalledWith('/tablet?pasadaId=101');
  });

  it('falls back to Artículo #id when no nested articulo/matching entry exists', async () => {
    const pasadaSinArticulo: Pasada = { id: 202, estado: 'en_curso', articuloId: 5 };
    renderWithProviders(<PasadaCard pasada={pasadaSinArticulo} etapas={etapas} />);

    expect(await screen.findByText('Artículo #5')).toBeInTheDocument();
  });

  it('renders --:-- when horaInicio is missing', async () => {
    const pasadaSinHora: Pasada = { id: 303, estado: 'en_curso', articuloId: 1, articulo: { id: 1, nombre: 'Articulo A' } };
    renderWithProviders(<PasadaCard pasada={pasadaSinHora} etapas={etapas} />);

    expect(await screen.findByText(/Inicio --:--/)).toBeInTheDocument();
  });

  it('counts a finished stage even when the API returns muestras in raw (unpopulated) shape', async () => {
    // The list endpoint doesn't eager-load muestra->etapa, so real API
    // responses carry `etapa` as a raw FK number and have no `etapaId`
    // field at all — this reproduces that exact shape, not the
    // already-normalized one the other tests use implicitly via [].
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getMuestras).mockResolvedValue([
      { id: 1, etapa: 10, estadoValidacion: 'ok', pesoNeto: 1.5 } as any,
    ]);

    renderWithProviders(<PasadaCard pasada={basePasada} etapas={etapas} />);

    expect(await screen.findByText(/Avance: Etapa 2 de 2/)).toBeInTheDocument();
  });
});
