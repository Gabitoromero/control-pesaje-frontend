import { screen } from '@testing-library/react';
import { renderWithAuth } from '../test/render';
import type { User } from '../shared/types/auth';
import { DashboardLayout } from './DashboardLayout';

const admin: User    = { id: 1, nombreUsuario: 'admin',  rol: 'administrador' };
const jefe: User     = { id: 2, nombreUsuario: 'jefe1',  rol: 'jefe'          };
const visual: User   = { id: 5, nombreUsuario: 'view1',  rol: 'visualizacion' };

describe('DashboardLayout — visibilidad del menú por rol', () => {
  it('administrador ve todos los items de navegación', () => {
    renderWithAuth(<DashboardLayout />, { user: admin, initialEntries: ['/dashboard'] });
    expect(screen.getByRole('link', { name: /en vivo/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /operación/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /artículos/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /usuarios/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /informes/i })).toBeInTheDocument();
  });

  it('jefe ve Artículos pero NO Usuarios', () => {
    renderWithAuth(<DashboardLayout />, { user: jefe, initialEntries: ['/dashboard'] });
    expect(screen.getByRole('link', { name: /en vivo/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /operación/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /informes/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /artículos/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /usuarios/i })).not.toBeInTheDocument();
  });

  it('visualizacion solo ve Monitoreo', () => {
    renderWithAuth(<DashboardLayout />, { user: visual, initialEntries: ['/dashboard'] });
    expect(screen.getByRole('link', { name: /en vivo/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /operación/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /artículos/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /usuarios/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /informes/i })).not.toBeInTheDocument();
  });

  it('redirige a /login si no está autenticado', () => {
    renderWithAuth(<DashboardLayout />, { initialEntries: ['/dashboard'] });
    expect(screen.queryByRole('link', { name: /monitoreo en vivo/i })).not.toBeInTheDocument();
  });

  it('muestra el nombre de usuario y rol en el footer del sidebar', () => {
    renderWithAuth(<DashboardLayout />, { user: jefe, initialEntries: ['/dashboard'] });
    expect(screen.getByText('jefe1')).toBeInTheDocument();
    expect(screen.getByText('jefe')).toBeInTheDocument();
  });
});
