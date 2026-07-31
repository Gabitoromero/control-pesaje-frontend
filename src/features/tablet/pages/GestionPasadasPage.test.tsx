import { screen, within } from '@testing-library/react';
import { renderWithAuth } from '../../../test/render';
import userEvent from '@testing-library/user-event';
import type { User } from '../../../shared/types/auth';
import { GestionPasadasPage } from './GestionPasadasPage';
import { vi } from 'vitest';
import { getPasadas, iniciarPasada } from '../../../api/pasadas';
import { getBalanzas } from '../../../api/balanzas';
import { getLinea, type Linea } from '../../../api/lineas';
import type { Pasada, Balanza } from '../../../shared/types/domain';

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

vi.mock('../../../api/balanzas', () => ({
  getBalanzas: vi.fn(),
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

const mockPasadas: Partial<Pasada>[] = [
  { id: 101, estado: 'en_curso', usuarioId: 3, articuloId: 1, createdAt: '', updatedAt: '' },
  { id: 102, estado: 'en_curso', usuarioId: 3, articuloId: 2, createdAt: '', updatedAt: '' },
];

const mockBalanzas: Balanza[] = [
  { id: 1, nombre: 'Balanza 1', activo: true },
  { id: 2, nombre: 'Balanza 2', activo: true },
];

const lineaConRuta = {
  id: 1,
  nombre: 'Línea 1',
  rutaPasadaActiva: { id: 10, nombre: 'Ruta A', etapas: [] },
  dispositivo: { id: 1, hardwareId: 'rpi-linea-a-001' },
  activo: true,
  idBalanza: 1,
} as unknown as Linea;

const lineaSinRuta = {
  id: 1,
  nombre: 'Línea 1',
  rutaPasadaActiva: null,
  activo: true,
  idBalanza: 1,
} as unknown as Linea;

describe('GestionPasadasPage', () => {
  beforeEach(() => {
    navigateMock.mockClear();
    vi.mocked(getPasadas).mockReset();
    vi.mocked(iniciarPasada).mockReset();
    vi.mocked(getBalanzas).mockReset();
    vi.mocked(getLinea).mockReset();

    // Default mocks: line with route assigned
    vi.mocked(getPasadas).mockResolvedValue(mockPasadas as Pasada[]);
    vi.mocked(getBalanzas).mockResolvedValue(mockBalanzas);
    vi.mocked(getLinea).mockResolvedValue(lineaConRuta);
  });

  // Task 3.7 / 3.9: clicking "Cerrar sesión" with an active line session
  // opens a confirm dialog before actually logging out.
  it('muestra diálogo de confirmación al hacer click en Cerrar sesión cuando hay activeLineaId (Task 3.7)', async () => {
    renderWithAuth(<GestionPasadasPage />, { user: operarioUser, activeLineaId: 1 });
    const btnCerrar = await screen.findByRole('button', { name: /cerrar sesión/i });
    await userEvent.click(btnCerrar);

    // The confirm dialog text must be visible and neither logout nor
    // closeLineSession should have run yet (user hasn't confirmed).
    const dialog = await screen.findByRole('alertdialog');
    expect(
      within(dialog).getByText(/tenés una sesión activa en esta línea/i)
    ).toBeInTheDocument();
  });

  it('llama a closeLineSession y logout solo después de confirmar el diálogo (Task 3.9)', async () => {
    const { authValue } = renderWithAuth(<GestionPasadasPage />, { user: operarioUser, activeLineaId: 1 });
    const btnCerrar = await screen.findByRole('button', { name: /cerrar sesión/i });
    await userEvent.click(btnCerrar);

    // Confirm dialog appears; logout should NOT have been called yet
    const dialog = await screen.findByRole('alertdialog');
    expect(authValue.closeLineSession).not.toHaveBeenCalled();
    expect(authValue.logout).not.toHaveBeenCalled();

    // Now confirm — destructive action button label matches confirmText
    const btnConfirmar = within(dialog).getByRole('button', { name: /cerrar sesión|confirmar/i });
    await userEvent.click(btnConfirmar);
    expect(authValue.closeLineSession).toHaveBeenCalled();
    expect(authValue.logout).toHaveBeenCalled();
  });

  it('no llama a logout si el usuario cancela el diálogo de confirmación (Task 3.9)', async () => {
    const { authValue } = renderWithAuth(<GestionPasadasPage />, { user: operarioUser, activeLineaId: 1 });
    const btnCerrar = await screen.findByRole('button', { name: /cerrar sesión/i });
    await userEvent.click(btnCerrar);

    const dialog = await screen.findByRole('alertdialog');
    const btnCancelar = within(dialog).getByRole('button', { name: /cancelar/i });
    await userEvent.click(btnCancelar);

    expect(authValue.closeLineSession).not.toHaveBeenCalled();
    expect(authValue.logout).not.toHaveBeenCalled();
  });

  it('no muestra diálogo de confirmación cuando activeLineaId es null (Task 3.8)', async () => {
    renderWithAuth(<GestionPasadasPage />, { user: operarioUser, activeLineaId: null });
    // The page redirects; the logout confirm text must never appear
    expect(screen.queryByText(/tenés una sesión activa en esta línea/i)).not.toBeInTheDocument();
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

  it('encierra el contenido en un raíz de altura fija con región de scroll interna (sin scroll del body)', async () => {
    const { container } = renderWithAuth(<GestionPasadasPage />, {
      user: operarioUser,
      activeLineaId: 1,
    });
    const root = container.querySelector('[data-testid="tablet-page-root"]');
    expect(root).not.toBeNull();
    const scrollRegion = root?.querySelector('[data-testid="tablet-page-scroll"]');
    expect(scrollRegion).not.toBeNull();
    // Content lives INSIDE the internal scroll region, never outside it
    const pasada = await screen.findByText('Pasada #101');
    expect(scrollRegion?.contains(pasada)).toBe(true);
  });

  // ── Task 4.1: balanza picker replacing the obsolete article picker ────────

  it('muestra el modal con la balanza de la línea preseleccionada y permite iniciar una pasada sin cambiarla', async () => {
    vi.mocked(iniciarPasada).mockResolvedValue({ id: 200 } as Pasada);
    renderWithAuth(<GestionPasadasPage />, { user: operarioUser, activeLineaId: 1 });

    const btnNuevaPasada = await screen.findByRole('button', { name: /nueva pasada/i });
    expect(btnNuevaPasada).not.toBeDisabled();
    await userEvent.click(btnNuevaPasada);

    expect(await screen.findByText('Iniciar Nueva Pasada')).toBeInTheDocument();
    // Both balanzas are listed as options
    expect(screen.getByText('Balanza 1')).toBeInTheDocument();
    expect(screen.getByText('Balanza 2')).toBeInTheDocument();

    // The línea's assigned balanza (id 1 → "Balanza 1") is preselected — the
    // confirm button is enabled without any interaction with the list.
    const btnIniciar = screen.getByRole('button', { name: /iniciar pasada/i });
    expect(btnIniciar).not.toBeDisabled();

    await userEvent.click(btnIniciar);

    expect(iniciarPasada).toHaveBeenCalledWith({ lineaProduccionId: 1, idBalanza: 1 });
    expect(iniciarPasada).not.toHaveBeenCalledWith(expect.objectContaining({ articuloId: expect.anything() }));
    expect(navigateMock).toHaveBeenCalledWith('/tablet?pasadaId=200');
  });

  it('permite anular la balanza por defecto seleccionando otra balanza activa antes de confirmar', async () => {
    vi.mocked(iniciarPasada).mockResolvedValue({ id: 201 } as Pasada);
    renderWithAuth(<GestionPasadasPage />, { user: operarioUser, activeLineaId: 1 });

    const btnNuevaPasada = await screen.findByRole('button', { name: /nueva pasada/i });
    await userEvent.click(btnNuevaPasada);

    expect(await screen.findByText('Iniciar Nueva Pasada')).toBeInTheDocument();

    // Override: pick "Balanza 2" instead of the default "Balanza 1"
    await userEvent.click(screen.getByText('Balanza 2'));

    const btnIniciar = screen.getByRole('button', { name: /iniciar pasada/i });
    await userEvent.click(btnIniciar);

    expect(iniciarPasada).toHaveBeenCalledWith({ lineaProduccionId: 1, idBalanza: 2 });
  });

  it('solo lista balanzas activas (según lo que retorna getBalanzas)', async () => {
    vi.mocked(getBalanzas).mockResolvedValue([{ id: 1, nombre: 'Balanza 1', activo: true }]);
    renderWithAuth(<GestionPasadasPage />, { user: operarioUser, activeLineaId: 1 });

    const btnNuevaPasada = await screen.findByRole('button', { name: /nueva pasada/i });
    await userEvent.click(btnNuevaPasada);

    expect(await screen.findByText('Iniciar Nueva Pasada')).toBeInTheDocument();
    expect(screen.getByText('Balanza 1')).toBeInTheDocument();
    expect(screen.queryByText('Balanza 2')).not.toBeInTheDocument();
  });

  it('muestra el error 422 del backend en el cuadro de error existente del modal', async () => {
    vi.mocked(iniciarPasada).mockRejectedValue({
      response: { data: { error: { message: 'La balanza seleccionada no está activa' } } },
    });
    renderWithAuth(<GestionPasadasPage />, { user: operarioUser, activeLineaId: 1 });

    const btnNuevaPasada = await screen.findByRole('button', { name: /nueva pasada/i });
    await userEvent.click(btnNuevaPasada);

    expect(await screen.findByText('Iniciar Nueva Pasada')).toBeInTheDocument();
    const btnIniciar = screen.getByRole('button', { name: /iniciar pasada/i });
    await userEvent.click(btnIniciar);

    expect(await screen.findByText('La balanza seleccionada no está activa')).toBeInTheDocument();
  });

  it('muestra el empty state cuando getBalanzas retorna vacío y bloquea la confirmación', async () => {
    vi.mocked(getBalanzas).mockResolvedValue([]);
    renderWithAuth(<GestionPasadasPage />, { user: operarioUser, activeLineaId: 1 });

    const btnNuevaPasada = await screen.findByRole('button', { name: /nueva pasada/i });
    await userEvent.click(btnNuevaPasada);

    expect(await screen.findByText('Iniciar Nueva Pasada')).toBeInTheDocument();
    expect(screen.getByText(/no hay balanzas activas/i)).toBeInTheDocument();

    const btnIniciar = screen.getByRole('button', { name: /iniciar pasada/i });
    expect(btnIniciar).toBeDisabled();
    expect(iniciarPasada).not.toHaveBeenCalled();
  });

  it('resetea la selección de balanza al cerrar y reabrir el modal (vuelve a preseleccionar la de la línea)', async () => {
    renderWithAuth(<GestionPasadasPage />, { user: operarioUser, activeLineaId: 1 });

    const btnNuevaPasada = await screen.findByRole('button', { name: /nueva pasada/i });
    await userEvent.click(btnNuevaPasada);
    expect(await screen.findByText('Iniciar Nueva Pasada')).toBeInTheDocument();

    // Override to Balanza 2, then close via the X button without confirming
    await userEvent.click(screen.getByText('Balanza 2'));
    const btnCerrarModal = screen.getByRole('button', { name: 'Cerrar modal' });
    await userEvent.click(btnCerrarModal);
    expect(screen.queryByText('Iniciar Nueva Pasada')).not.toBeInTheDocument();

    // Re-open — the default (línea's balanza, id 1) must be preselected again
    await userEvent.click(screen.getByRole('button', { name: /nueva pasada/i }));
    expect(await screen.findByText('Iniciar Nueva Pasada')).toBeInTheDocument();

    vi.mocked(iniciarPasada).mockResolvedValue({ id: 202 } as Pasada);
    await userEvent.click(screen.getByRole('button', { name: /iniciar pasada/i }));
    expect(iniciarPasada).toHaveBeenCalledWith({ lineaProduccionId: 1, idBalanza: 1 });
  });

  it('no contiene ningún rastro del selector de artículo obsoleto', async () => {
    renderWithAuth(<GestionPasadasPage />, { user: operarioUser, activeLineaId: 1 });

    const btnNuevaPasada = await screen.findByRole('button', { name: /nueva pasada/i });
    await userEvent.click(btnNuevaPasada);

    expect(await screen.findByText('Iniciar Nueva Pasada')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/buscar artículo/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/seleccione el artículo/i)).not.toBeInTheDocument();
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

      const btnRegistrar = screen.getByRole('button', { name: /tomar muestras libres/i });
      await userEvent.click(btnRegistrar);
      expect(navigateMock).toHaveBeenCalledWith('/tablet/muestras-libres');
    });
  });

  describe('progreso de etapas por pasada (StagePillRow)', () => {
    it('muestra el texto de avance de etapas para cada pasada', async () => {
      renderWithAuth(<GestionPasadasPage />, { user: operarioUser, activeLineaId: 1 });

      expect(await screen.findByText('Pasada #101')).toBeInTheDocument();
      const avanceTexts = screen.getAllByText(/Avance: Etapa/i);
      expect(avanceTexts.length).toBe(mockPasadas.length);
    });
  });

  describe('layout responsivo de dos columnas', () => {
    it('aplica el breakpoint personalizado min-[840px] para el grid de dos columnas', async () => {
      const { container } = renderWithAuth(<GestionPasadasPage />, {
        user: operarioUser,
        activeLineaId: 1,
      });

      await screen.findByText('Pasada #101');

      const grid = container.querySelector('.grid.grid-cols-1.min-\\[840px\\]\\:grid-cols-\\[1fr_416px\\]');
      expect(grid).not.toBeNull();
    });

    it('aplica los breakpoints no monótonos para las columnas de pasadas activas', async () => {
      const { container } = renderWithAuth(<GestionPasadasPage />, {
        user: operarioUser,
        activeLineaId: 1,
      });

      await screen.findByText('Pasada #101');

      const pasadasGrid = container.querySelector('.grid.grid-cols-1.min-\\[480px\\]\\:grid-cols-2');
      expect(pasadasGrid).not.toBeNull();
      expect(pasadasGrid?.className).toContain('min-[840px]:grid-cols-1');
      expect(pasadasGrid?.className).toContain('min-[950px]:grid-cols-2');
    });
  });
});
