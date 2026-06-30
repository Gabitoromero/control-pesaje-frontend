import { screen } from '@testing-library/react';
import { renderWithAuth } from '../../../test/render';
import userEvent from '@testing-library/user-event';
import type { User } from '../../../shared/types/auth';
import { GestionPasadasPage } from './GestionPasadasPage';
import { vi } from 'vitest';
import { getPasadas, iniciarPasada } from '../../../api/pasadas';
import { getArticulosPorRuta } from '../../../api/rutas-pasadas-articulos';
import { getLinea } from '../../../api/lineas';
import { useMuestrasLibresContext } from '../context/MuestrasLibresContext';

vi.mock('../context/MuestrasLibresContext', () => ({
  useMuestrasLibresContext: vi.fn(),
}));
const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../../../api/pasadas', () => ({
  getPasadas: vi.fn(),
  iniciarPasada: vi.fn(),
}));

vi.mock('../../../api/rutas-pasadas-articulos', () => ({
  getArticulosPorRuta: vi.fn(),
}));

vi.mock('../../../api/lineas', () => ({
  getLinea: vi.fn(),
}));

const operarioUser: User = {
  id: 3,
  legajo: 'O1',
  nombreUsuario: 'operario1',
  rol: 'operario',
  puedeTomarMuestrasLibres: false,
};

const calidadUser: User = {
  id: 5,
  legajo: 'C1',
  nombreUsuario: 'calidad1',
  rol: 'operario',
  puedeTomarMuestrasLibres: true,
};

const mockPasadas: any[] = [
  { id: 101, estado: 'en_curso', usuarioId: 3, articuloId: 1, createdAt: '', updatedAt: '' },
  { id: 102, estado: 'en_curso', usuarioId: 3, articuloId: 2, createdAt: '', updatedAt: '' },
];

const mockArticulos = [
  { id: 1, nombre: 'Articulo A', marca: 'Marca X', activo: true },
  { id: 2, nombre: 'Articulo B', marca: 'Marca Y', activo: true },
];

const lineaConRuta = {
  id: 1,
  nombre: 'Línea 1',
  numeroBalanza: 1,
  rutaPasadaActiva: { id: 10, nombre: 'Ruta A', etapas: [] },
  activo: true,
};

const lineaSinRuta = {
  id: 1,
  nombre: 'Línea 1',
  numeroBalanza: 1,
  rutaPasadaActiva: null,
  activo: true,
};

describe('GestionPasadasPage', () => {
  beforeEach(() => {
    navigateMock.mockClear();
    vi.mocked(getPasadas).mockReset();
    vi.mocked(iniciarPasada).mockReset();
    vi.mocked(getArticulosPorRuta).mockReset();
    vi.mocked(getLinea).mockReset();

    // Default mocks: line with route assigned
    vi.mocked(getPasadas).mockResolvedValue(mockPasadas);
    vi.mocked(getArticulosPorRuta).mockResolvedValue(mockArticulos);
    vi.mocked(getLinea).mockResolvedValue(lineaConRuta);

    // Default context mock: no samples
    vi.mocked(useMuestrasLibresContext).mockReturnValue({
      muestras: [],
      etapas: [],
      addSample: vi.fn().mockResolvedValue(undefined),
      removeSample: vi.fn().mockResolvedValue(undefined),
      clearSession: vi.fn(),
      isRegistering: false,
      selectedEtapaId: null,
      setSelectedEtapaId: vi.fn(),
    });
  });

  it('llama a closeLineSession y logout al hacer click en Cerrar sesión', async () => {
    const { authValue } = renderWithAuth(<GestionPasadasPage />, { user: operarioUser, activeLineaId: 1 });
    const btnCerrar = await screen.findByRole('button', { name: /cerrar sesión/i });
    await userEvent.click(btnCerrar);
    expect(authValue.closeLineSession).toHaveBeenCalled();
    expect(authValue.logout).toHaveBeenCalled();
  });

  it('muestra la lista de pasadas mockeadas', async () => {
    renderWithAuth(<GestionPasadasPage />, { user: operarioUser, activeLineaId: 1 });
    expect(await screen.findByText('Pasada #101')).toBeInTheDocument();
    expect(screen.getByText('Pasada #102')).toBeInTheDocument();
  });

  it('navega al workspace al hacer click en Continuar en una pasada', async () => {
    renderWithAuth(<GestionPasadasPage />, { user: operarioUser, activeLineaId: 1 });
    const btnContinuar = await screen.findAllByRole('button', { name: /continuar/i });
    expect(btnContinuar.length).toBeGreaterThan(0);
    await userEvent.click(btnContinuar[0]);
    expect(navigateMock).toHaveBeenCalledWith('/tablet?pasadaId=101');
  });

  it('redirige si activeLineaId es null', () => {
    renderWithAuth(<GestionPasadasPage />, { user: operarioUser, activeLineaId: null });
    expect(screen.queryByText('Gestión de Pasadas')).not.toBeInTheDocument();
  });

  it('muestra el modal y permite iniciar una pasada', async () => {
    vi.mocked(iniciarPasada).mockResolvedValue({ id: 200 } as any);
    renderWithAuth(<GestionPasadasPage />, { user: operarioUser, activeLineaId: 1 });

    // Wait for linea to load so the button is enabled
    const btnNuevaPasada = await screen.findByRole('button', { name: /nueva pasada/i });
    expect(btnNuevaPasada).not.toBeDisabled();
    await userEvent.click(btnNuevaPasada);

    // Modal should show articles
    expect(await screen.findByText('Iniciar Nueva Pasada')).toBeInTheDocument();
    expect(screen.getByText('Articulo A')).toBeInTheDocument();

    // Select article
    await userEvent.click(screen.getByText('Articulo A'));

    // Click Iniciar Pasada
    const btnIniciar = screen.getByRole('button', { name: /iniciar pasada/i });
    await userEvent.click(btnIniciar);

    // Verify API call and navigation
    expect(iniciarPasada).toHaveBeenCalledWith({ lineaProduccionId: 1, articuloId: 1 });
    expect(navigateMock).toHaveBeenCalledWith('/tablet?pasadaId=200');
  });

  it('muestra el empty state cuando getArticulosPorRuta retorna vacío', async () => {
    vi.mocked(getArticulosPorRuta).mockResolvedValue([]);
    renderWithAuth(<GestionPasadasPage />, { user: operarioUser, activeLineaId: 1 });

    const btnNuevaPasada = await screen.findByRole('button', { name: /nueva pasada/i });
    expect(btnNuevaPasada).not.toBeDisabled();
    await userEvent.click(btnNuevaPasada);

    expect(await screen.findByText('Iniciar Nueva Pasada')).toBeInTheDocument();
    expect(screen.getByText('No hay artículos asignados a esta ruta')).toBeInTheDocument();
  });

  describe('cuando la línea no tiene ruta asignada', () => {
    beforeEach(() => {
      vi.mocked(getLinea).mockResolvedValue(lineaSinRuta);
    });

    it('muestra el warning de ruta no asignada', async () => {
      renderWithAuth(<GestionPasadasPage />, { user: operarioUser, activeLineaId: 1 });
      expect(await screen.findByText('Sin ruta de pesaje asignada')).toBeInTheDocument();
      expect(
        screen.getByText(/solicitar asignacion|asigne una ruta/i)
      ).toBeInTheDocument();
    });

    it('deshabilita el botón Nueva Pasada cuando no hay ruta', async () => {
      renderWithAuth(<GestionPasadasPage />, { user: operarioUser, activeLineaId: 1 });

      // Wait for linea query to resolve
      await screen.findByText('Sin ruta de pesaje asignada');

      const btnNuevaPasada = screen.getByRole('button', { name: /nueva pasada/i });
      expect(btnNuevaPasada).toBeDisabled();
    });

    it('no abre el modal al intentar hacer click en Nueva Pasada sin ruta', async () => {
      renderWithAuth(<GestionPasadasPage />, { user: operarioUser, activeLineaId: 1 });

      await screen.findByText('Sin ruta de pesaje asignada');

      const btnNuevaPasada = screen.getByRole('button', { name: /nueva pasada/i });
      // Attempt click on disabled button — modal should never open
      await userEvent.click(btnNuevaPasada);

      expect(screen.queryByText('Iniciar Nueva Pasada')).not.toBeInTheDocument();
    });
  });

  describe('sección de muestras libres (puedeTomarMuestrasLibres)', () => {
    it('muestra la sección cuando el usuario tiene permiso y hay ruta activa', async () => {
      vi.mocked(getLinea).mockResolvedValue(lineaConRuta);

      renderWithAuth(<GestionPasadasPage />, { user: calidadUser, activeLineaId: 1 });

      expect(await screen.findByTestId('muestras-libres-section')).toBeInTheDocument();
    });

    it('no muestra la sección cuando puedeTomarMuestrasLibres es false', async () => {
      vi.mocked(getLinea).mockResolvedValue(lineaConRuta);

      renderWithAuth(<GestionPasadasPage />, { user: operarioUser, activeLineaId: 1 });

      // Wait for the page to finish loading
      await screen.findByText('Pasada #101');

      expect(screen.queryByTestId('muestras-libres-section')).not.toBeInTheDocument();
    });

    it('no muestra la sección cuando la línea no tiene ruta activa', async () => {
      vi.mocked(getLinea).mockResolvedValue(lineaSinRuta);

      renderWithAuth(<GestionPasadasPage />, { user: calidadUser, activeLineaId: 1 });

      // Wait for the no-route warning to appear
      await screen.findByText('Sin ruta de pesaje asignada');

      expect(screen.queryByTestId('muestras-libres-section')).not.toBeInTheDocument();
    });

    it('muestra botón para ir a selección de etapa cuando el usuario tiene permiso y hay ruta activa', async () => {
      vi.mocked(getLinea).mockResolvedValue(lineaConRuta);

      renderWithAuth(<GestionPasadasPage />, { user: calidadUser, activeLineaId: 1 });

      await screen.findByTestId('muestras-libres-section');

      const btnRegistrar = screen.getByRole('button', { name: /registrar muestras libres/i });
      await userEvent.click(btnRegistrar);
      expect(navigateMock).toHaveBeenCalledWith('/tablet/muestras-libres/seleccion');
    });

    it('muestra las muestras acumuladas en la sección', async () => {
      vi.mocked(getLinea).mockResolvedValue(lineaConRuta);
      vi.mocked(useMuestrasLibresContext).mockReturnValue({
        muestras: [
          {
            id: 1,
            pesoNeto: 12.5,
            estadoValidacion: 'ok',
            usuarioId: 5,
            etapaId: 10,
            lineaProduccionId: 1,
            timestamp: new Date(),
          },
        ],
        etapas: [],
        addSample: vi.fn().mockResolvedValue(undefined),
        removeSample: vi.fn().mockResolvedValue(undefined),
        clearSession: vi.fn(),
        isRegistering: false,
        selectedEtapaId: 10,
        setSelectedEtapaId: vi.fn(),
      });

      renderWithAuth(<GestionPasadasPage />, { user: calidadUser, activeLineaId: 1 });

      await screen.findByTestId('muestras-libres-section');
      expect(screen.getByText('12.500 kg')).toBeInTheDocument();
    });

    it('muestra botón limpiar sesión cuando hay muestras', async () => {
      vi.mocked(getLinea).mockResolvedValue(lineaConRuta);
      vi.mocked(useMuestrasLibresContext).mockReturnValue({
        muestras: [
          {
            id: 2,
            pesoNeto: 5.0,
            estadoValidacion: 'ok',
            usuarioId: 5,
            etapaId: 10,
            lineaProduccionId: 1,
            timestamp: new Date(),
          },
        ],
        etapas: [],
        addSample: vi.fn().mockResolvedValue(undefined),
        removeSample: vi.fn().mockResolvedValue(undefined),
        clearSession: vi.fn(),
        isRegistering: false,
        selectedEtapaId: 10,
        setSelectedEtapaId: vi.fn(),
      });

      renderWithAuth(<GestionPasadasPage />, { user: calidadUser, activeLineaId: 1 });

      await screen.findByTestId('muestras-libres-section');
      expect(screen.getByRole('button', { name: /limpiar sesión/i })).toBeInTheDocument();
    });
  });
});
