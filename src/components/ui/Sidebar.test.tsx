import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { renderWithAuth } from '../../test/render';
import type { User } from '../../shared/types/auth';
import { Sidebar } from './Sidebar';

const admin: User    = { id: 1, legajo: 'A1', nombreUsuario: 'admin',  rol: 'administrador', puedeTomarMuestrasLibres: true };
const jefe: User     = { id: 2, legajo: 'J1', nombreUsuario: 'jefe1',  rol: 'jefe', puedeTomarMuestrasLibres: true };

describe('Sidebar', () => {
  it('renders navigation links and user info based on role', () => {
    renderWithAuth(<Sidebar />, { user: admin, initialEntries: ['/dashboard'] });
    expect(screen.getByRole('link', { name: /monitoreo/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /planta/i })).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
  });

  it('calls onNavClick when a navigation link is clicked', async () => {
    const userEventSetup = userEvent.setup();
    const handleNavClick = vi.fn();
    
    renderWithAuth(<Sidebar onNavClick={handleNavClick} />, { 
      user: admin, 
      initialEntries: ['/dashboard'] 
    });
    
    const monitoreoLink = screen.getByRole('link', { name: /monitoreo/i });
    await userEventSetup.click(monitoreoLink);
    
    expect(handleNavClick).toHaveBeenCalledTimes(1);
  });

  it('calls onNavClick when a nested navigation link is clicked (e.g. catalogo)', async () => {
    const userEventSetup = userEvent.setup();
    const handleNavClick = vi.fn();

    renderWithAuth(<Sidebar onNavClick={handleNavClick} />, {
      user: jefe,
      initialEntries: ['/dashboard']
    });

    const catalogoToggle = screen.getByRole('button', { name: /catálogo/i });
    await userEventSetup.click(catalogoToggle);

    const articulosLink = screen.getByRole('link', { name: /artículos/i });
    await userEventSetup.click(articulosLink);

    expect(handleNavClick).toHaveBeenCalledTimes(1);
  });

  it('splits Gestión into separate Catálogo (jefe) and Administración (admin-only) groups', async () => {
    const userEventSetup = userEvent.setup();

    renderWithAuth(<Sidebar />, { user: admin, initialEntries: ['/dashboard'] });

    expect(screen.queryByRole('button', { name: /gestión/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /catálogo/i })).toBeInTheDocument();

    const administracionToggle = screen.getByRole('button', { name: /administración/i });
    await userEventSetup.click(administracionToggle);

    expect(screen.getByRole('link', { name: /usuarios/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sesiones activas/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /dispositivos/i })).toBeInTheDocument();
  });

  it('hides the Administración group for jefe (non-admin) users', () => {
    renderWithAuth(<Sidebar />, { user: jefe, initialEntries: ['/dashboard'] });

    expect(screen.getByRole('button', { name: /catálogo/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /administración/i })).not.toBeInTheDocument();
  });
});
