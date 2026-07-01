import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test/render';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MuestrasLibresSeleccionPage } from './MuestrasLibresSeleccionPage';
import { useMuestrasLibresContext } from '../context/MuestrasLibresContext';
import { useOutletContext } from 'react-router-dom';
import type { RutaPasadaEtapa } from '../../../shared/types/domain';

vi.mock('../context/MuestrasLibresContext', () => ({
  useMuestrasLibresContext: vi.fn(),
}));

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useOutletContext: vi.fn(),
  };
});

const setSelectedEtapaIdMock = vi.fn();

const mockContextValue = {
  muestras: [],
  etapas: [],
  addSample: vi.fn().mockResolvedValue(undefined),
  removeSample: vi.fn().mockResolvedValue(undefined),
  updateSample: vi.fn().mockResolvedValue(undefined),
  clearSession: vi.fn(),
  isRegistering: false,
  selectedEtapaId: null,
  setSelectedEtapaId: setSelectedEtapaIdMock,
};

const sampleEtapas: RutaPasadaEtapa[] = [
  {
    id: 1,
    etapa: { id: 10, nombre: 'Amasado' },
    orden: 1,
    pesoMinimo: 10,
    pesoIdeal: 15,
    pesoMaximo: 20,
    cantidadMuestrasRequeridas: 2,
  },
  {
    id: 2,
    etapa: { id: 20, nombre: 'Horneado' },
    orden: 2,
    pesoMinimo: 30,
    pesoIdeal: 35,
    pesoMaximo: 40,
    cantidadMuestrasRequeridas: 1,
  },
];

describe('MuestrasLibresSeleccionPage', () => {
  beforeEach(() => {
    navigateMock.mockClear();
    setSelectedEtapaIdMock.mockClear();
    vi.mocked(useMuestrasLibresContext).mockReturnValue(mockContextValue);
    vi.mocked(useOutletContext).mockReturnValue({ etapas: sampleEtapas });
  });

  it('shows "No hay etapas configuradas" when etapas list is empty', () => {
    vi.mocked(useOutletContext).mockReturnValue({ etapas: [] });
    renderWithProviders(<MuestrasLibresSeleccionPage />);
    expect(screen.getByText(/no hay etapas configuradas/i)).toBeInTheDocument();
  });

  it('renders one button per etapa', () => {
    renderWithProviders(<MuestrasLibresSeleccionPage />);
    const buttons = screen.getAllByRole('button', { name: /amasado|horneado/i });
    expect(buttons).toHaveLength(2);
  });

  it('renders the etapa nombre in each button', () => {
    renderWithProviders(<MuestrasLibresSeleccionPage />);
    expect(screen.getByRole('button', { name: /amasado/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /horneado/i })).toBeInTheDocument();
  });

  it('clicking an etapa button calls setSelectedEtapaId with the correct id', async () => {
    renderWithProviders(<MuestrasLibresSeleccionPage />);
    await userEvent.click(screen.getByRole('button', { name: /amasado/i }));
    expect(setSelectedEtapaIdMock).toHaveBeenCalledWith(10);
  });

  it('clicking an etapa button navigates to /tablet/muestras-libres/registro', async () => {
    renderWithProviders(<MuestrasLibresSeleccionPage />);
    await userEvent.click(screen.getByRole('button', { name: /horneado/i }));
    expect(navigateMock).toHaveBeenCalledWith('/tablet/muestras-libres/registro');
  });

  it('has a back button that navigates to /tablet/pasadas', async () => {
    renderWithProviders(<MuestrasLibresSeleccionPage />);
    const backBtn = screen.getByRole('button', { name: /volver/i });
    await userEvent.click(backBtn);
    expect(navigateMock).toHaveBeenCalledWith('/tablet/pasadas');
  });
});
