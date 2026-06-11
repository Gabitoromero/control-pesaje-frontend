import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithAuth } from '../test/render';
import type { User } from '../shared/types/auth';
import { DashboardLayout } from './DashboardLayout';

const admin: User    = { id: 1, legajo: 'A1', nombreUsuario: 'admin',  rol: 'administrador', puedeTomarMuestrasLibres: true };
const jefe: User     = { id: 2, legajo: 'J1', nombreUsuario: 'jefe1',  rol: 'jefe', puedeTomarMuestrasLibres: true };
const visual: User   = { id: 5, legajo: 'V1', nombreUsuario: 'view1',  rol: 'visualizacion', puedeTomarMuestrasLibres: false };

describe('DashboardLayout — visibilidad del menú por rol', () => {
  it('administrador ve todos los items de navegación principales', () => {
    renderWithAuth(<DashboardLayout />, { user: admin, initialEntries: ['/dashboard'] });
    expect(screen.getByRole('link', { name: /monitoreo/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /planta/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /gestión/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /reportes/i })).toBeInTheDocument();
  });

  it('jefe ve los principales y gestión, pero sus enlaces internos de gestión dependen del toggle', async () => {
    const userEventSetup = userEvent.setup();
    renderWithAuth(<DashboardLayout />, { user: jefe, initialEntries: ['/dashboard'] });
    expect(screen.getByRole('link', { name: /monitoreo/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /planta/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /reportes/i })).toBeInTheDocument();

    const gestionToggle = screen.getByRole('button', { name: /gestión/i });
    
    // Hidden by default on /dashboard
    expect(screen.queryByRole('link', { name: /artículos/i })).not.toBeInTheDocument();
    
    // Show on click
    await userEventSetup.click(gestionToggle);
    expect(screen.getByRole('link', { name: /artículos/i })).toBeInTheDocument();
    
    // Check Jefe doesn't see Usuarios
    expect(screen.queryByRole('link', { name: /usuarios/i })).not.toBeInTheDocument();
    
    // Hide on click again
    await userEventSetup.click(gestionToggle);
    await waitFor(() => {
      expect(screen.queryByRole('link', { name: /artículos/i })).not.toBeInTheDocument();
    });
  });

  it('Gestión se auto-expande si la ruta coincide con un sub-item', () => {
    renderWithAuth(<DashboardLayout />, { user: admin, initialEntries: ['/dashboard/articulos'] });
    // Should be visible right away without clicking
    expect(screen.getByRole('link', { name: /artículos/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /usuarios/i })).toBeInTheDocument();
  });

  it('visualizacion solo ve Monitoreo', () => {
    renderWithAuth(<DashboardLayout />, { user: visual, initialEntries: ['/dashboard'] });
    expect(screen.getByRole('link', { name: /monitoreo/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /planta/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /gestión/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /reportes/i })).not.toBeInTheDocument();
  });

  it('redirige a /login si no está autenticado', () => {
    renderWithAuth(<DashboardLayout />, { initialEntries: ['/dashboard'] });
    expect(screen.queryByRole('link', { name: /monitoreo/i })).not.toBeInTheDocument();
  });

  it('muestra el nombre de usuario y rol en el footer del sidebar', () => {
    renderWithAuth(<DashboardLayout />, { user: jefe, initialEntries: ['/dashboard'] });
    expect(screen.getByText('jefe1')).toBeInTheDocument();
    expect(screen.getByText('jefe')).toBeInTheDocument();
  });
});
