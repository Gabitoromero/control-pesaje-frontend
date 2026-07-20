import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithAuth } from '../test/render';
import type { User } from '../shared/types/auth';
import { vi, describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { DashboardLayout } from './DashboardLayout';
import { useAdminSocket } from '../features/dashboard/hooks/useAdminSocket';
const admin: User    = { id: 1, legajo: 'A1', nombreUsuario: 'admin',  rol: 'administrador', puedeTomarMuestrasLibres: true };
const jefe: User     = { id: 2, legajo: 'J1', nombreUsuario: 'jefe1',  rol: 'jefe', puedeTomarMuestrasLibres: true };
const visual: User   = { id: 5, legajo: 'V1', nombreUsuario: 'view1',  rol: 'visualizacion', puedeTomarMuestrasLibres: false };

vi.mock('../features/dashboard/hooks/useAdminSocket', () => ({
  useAdminSocket: vi.fn(),
}));

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function mock(
    this: HTMLDialogElement
  ) {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function mock(
    this: HTMLDialogElement
  ) {
    this.open = false;
  });
});

describe('DashboardLayout — visibilidad del menú por rol', () => {
  beforeEach(() => {
    vi.mocked(useAdminSocket).mockReturnValue({
      unassignedDevices: [],
      resolveDevice: vi.fn(),
    });
  });

  it('administrador ve todos los items de navegación principales', () => {
    renderWithAuth(<DashboardLayout />, { user: admin, initialEntries: ['/dashboard'] });
    expect(screen.getByRole('link', { name: /monitoreo/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /planta/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /catálogo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /administración/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /reportes/i })).toBeInTheDocument();
  });

  it('jefe ve los principales, catálogo y administración; los sub-items admin-only se ocultan', async () => {
    const userEventSetup = userEvent.setup();
    renderWithAuth(<DashboardLayout />, { user: jefe, initialEntries: ['/dashboard'] });
    expect(screen.getByRole('link', { name: /monitoreo/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /planta/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /reportes/i })).toBeInTheDocument();

    // Administración es visible para jefe (aunque sus sub-items admin-only se ocultan)
    expect(screen.getByRole('button', { name: /administración/i })).toBeInTheDocument();

    const catalogoToggle = screen.getByRole('button', { name: /catálogo/i });

    // Hidden by default on /dashboard
    expect(screen.queryByRole('link', { name: /artículos/i })).not.toBeInTheDocument();

    // Show on click
    await userEventSetup.click(catalogoToggle);
    expect(screen.getByRole('link', { name: /artículos/i })).toBeInTheDocument();

    // Jefe doesn't see Usuarios inside Catálogo (admin-only)
    expect(screen.queryByRole('link', { name: /usuarios/i })).not.toBeInTheDocument();

    // Hide on click again
    await userEventSetup.click(catalogoToggle);
    await waitFor(() => {
      expect(screen.queryByRole('link', { name: /artículos/i })).not.toBeInTheDocument();
    });
  });

  it('Catálogo se auto-expande si la ruta coincide con un sub-item, sin afectar a Administración', () => {
    renderWithAuth(<DashboardLayout />, { user: admin, initialEntries: ['/dashboard/articulos'] });
    // Catálogo visible right away without clicking (includes Usuarios, now under Catálogo)
    expect(screen.getByRole('link', { name: /artículos/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /usuarios/i })).toBeInTheDocument();
    // Administración stays collapsed — the route doesn't match any of its sub-items
    expect(screen.queryByRole('link', { name: /pasadas activas/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /sesiones activas/i })).not.toBeInTheDocument();
  });

  it('Administración se auto-expande si la ruta coincide con un sub-item, sin afectar a Catálogo', () => {
    renderWithAuth(<DashboardLayout />, { user: admin, initialEntries: ['/dashboard/pasadas-activas'] });
    // Administración auto-expande — Pasadas Activas visible
    expect(screen.getByRole('link', { name: /pasadas activas/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /dispositivos/i })).toBeInTheDocument();
    // Catálogo stays collapsed — the route doesn't match any of its sub-items
    expect(screen.queryByRole('link', { name: /usuarios/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /artículos/i })).not.toBeInTheDocument();
  });

  it('visualizacion solo ve Monitoreo', () => {
    renderWithAuth(<DashboardLayout />, { user: visual, initialEntries: ['/dashboard'] });
    expect(screen.getByRole('link', { name: /monitoreo/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /planta/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /catálogo/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /administración/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /reportes/i })).not.toBeInTheDocument();
  });

  it('redirige a /login si no está autenticado', () => {
    renderWithAuth(<DashboardLayout />, { initialEntries: ['/dashboard'] });
    expect(screen.queryByRole('link', { name: /monitoreo/i })).not.toBeInTheDocument();
  });

  it('muestra el nombre de usuario y rol en el footer del sidebar', () => {
    renderWithAuth(<DashboardLayout />, { user: jefe, initialEntries: ['/dashboard'] });
    expect(screen.getAllByText('jefe1')[0]).toBeInTheDocument();
    expect(screen.getAllByText('jefe')[0]).toBeInTheDocument();
  });

  it('abre y cierra el sidebar móvil usando el menú hamburguesa', async () => {
    const userEventSetup = userEvent.setup();
    renderWithAuth(<DashboardLayout />, { user: admin, initialEntries: ['/dashboard'] });
    
    // El drawer debería estar cerrado/oculto inicialmente
    const dialog = screen.getByRole('dialog', { hidden: true });
    expect(dialog).not.toBeVisible();
    
    // Clickeamos el menú hamburguesa
    const menuButton = screen.getByRole('button', { name: /abrir menú/i });
    await userEventSetup.click(menuButton);
    
    // Ahora el dialog debería mostrarse
    expect(dialog).toBeVisible();
    
    // Clickeamos un enlace para probar que se cierra
    const monitoreoLink = screen.getAllByRole('link', { name: /monitoreo/i })[1]; // El del dialog
    await userEventSetup.click(monitoreoLink);
    
    // Debería estar cerrado de nuevo
    expect(dialog).not.toBeVisible();
  });
});

describe('DashboardLayout — banner de dispositivo sin asignar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra el banner para jefe cuando hay un dispositivo sin asignar', () => {
    vi.mocked(useAdminSocket).mockReturnValue({
      unassignedDevices: ['rpi-unknown-device'],
      resolveDevice: vi.fn(),
    });

    renderWithAuth(<DashboardLayout />, { user: jefe, initialEntries: ['/dashboard'] });

    expect(screen.getByText(/dispositivo desconocido/i)).toBeInTheDocument();
  });

  it('muestra el banner para administrador cuando hay un dispositivo sin asignar', () => {
    vi.mocked(useAdminSocket).mockReturnValue({
      unassignedDevices: ['rpi-unknown-device'],
      resolveDevice: vi.fn(),
    });

    renderWithAuth(<DashboardLayout />, { user: admin, initialEntries: ['/dashboard'] });

    expect(screen.getByText(/dispositivo desconocido/i)).toBeInTheDocument();
  });

  it('no muestra el banner para visualización, ni siquiera con dispositivos sin asignar', () => {
    vi.mocked(useAdminSocket).mockReturnValue({
      unassignedDevices: ['rpi-unknown-device'],
      resolveDevice: vi.fn(),
    });

    renderWithAuth(<DashboardLayout />, { user: visual, initialEntries: ['/dashboard'] });

    expect(screen.queryByText(/dispositivo desconocido/i)).not.toBeInTheDocument();
    expect(useAdminSocket).not.toHaveBeenCalled();
  });
});
