import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { renderWithAuth } from '../../test/render';
import type { User } from '../../shared/types/auth';
import { Sidebar } from './Sidebar';

const admin: User    = { id: 1, legajo: 'A1', nombreUsuario: 'admin',  rol: 'administrador', puedeTomarMuestrasLibres: true };
const jefe: User     = { id: 2, legajo: 'J1', nombreUsuario: 'jefe1',  rol: 'jefe', puedeTomarMuestrasLibres: true };
const operario: User = { id: 3, legajo: 'O1', nombreUsuario: 'oper1',  rol: 'operario', puedeTomarMuestrasLibres: false };

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

  it('calls onNavClick when a nested navigation link is clicked (e.g. parametrizacion)', async () => {
    const userEventSetup = userEvent.setup();
    const handleNavClick = vi.fn();

    renderWithAuth(<Sidebar onNavClick={handleNavClick} />, {
      user: jefe,
      initialEntries: ['/dashboard']
    });

    const catalogoToggle = screen.getByRole('button', { name: /parametrización/i });
    await userEventSetup.click(catalogoToggle);

    const articulosLink = screen.getByRole('link', { name: /artículos/i });
    await userEventSetup.click(articulosLink);

    expect(handleNavClick).toHaveBeenCalledTimes(1);
  });

  it('splits Gestión into separate Parametrización (jefe) and Administración (admin-only) groups', async () => {
    const userEventSetup = userEvent.setup();

    renderWithAuth(<Sidebar />, { user: admin, initialEntries: ['/dashboard'] });

    expect(screen.queryByRole('button', { name: /gestión/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /parametrización/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /administración/i })).toBeInTheDocument();

    // Usuarios (admin-only) está bajo Parametrización
    const catalogoToggle = screen.getByRole('button', { name: /parametrización/i });
    await userEventSetup.click(catalogoToggle);

    expect(screen.getByRole('link', { name: /usuarios/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /artículos/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /rutas/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /dispositivos/i })).toBeInTheDocument();

    // Administración tiene sus propios sub-items
    const administracionToggle = screen.getByRole('button', { name: /administración/i });
    await userEventSetup.click(administracionToggle);

    expect(screen.getByRole('link', { name: /sesiones activas/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /pasadas activas/i })).toBeInTheDocument();
  });

  it('hides admin-only sub-items from jefe but shows Administración group', async () => {
    const userEventSetup = userEvent.setup();

    renderWithAuth(<Sidebar />, { user: jefe, initialEntries: ['/dashboard'] });

    expect(screen.getByRole('button', { name: /parametrización/i })).toBeInTheDocument();
    // Administración es visible para jefe, pero sus sub-items admin-only se ocultan
    expect(screen.getByRole('button', { name: /administración/i })).toBeInTheDocument();

    const catalogoToggle = screen.getByRole('button', { name: /parametrización/i });
    await userEventSetup.click(catalogoToggle);
    expect(screen.getByRole('link', { name: /dispositivos/i })).toBeInTheDocument();

    const administracionToggle = screen.getByRole('button', { name: /administración/i });
    await userEventSetup.click(administracionToggle);

    // Pasadas Activas visible para jefe
    expect(screen.getByRole('link', { name: /pasadas activas/i })).toBeInTheDocument();
    // Sesiones Activas es admin-only — el jefe NO la ve
    expect(screen.queryByRole('link', { name: /sesiones activas/i })).not.toBeInTheDocument();
  });

  it('shows the admin-only Muestras item inside Parametrización for ADMINISTRADOR', async () => {
    const userEventSetup = userEvent.setup();
    renderWithAuth(<Sidebar />, { user: admin, initialEntries: ['/dashboard'] });

    await userEventSetup.click(screen.getByRole('button', { name: /parametrización/i }));

    const link = screen.getByRole('link', { name: /muestras/i });
    expect(link).toHaveAttribute('href', '/dashboard/muestras');
  });

  it('hides Muestras from JEFE even though Parametrización is visible to them', async () => {
    const userEventSetup = userEvent.setup();
    renderWithAuth(<Sidebar />, { user: jefe, initialEntries: ['/dashboard'] });

    await userEventSetup.click(screen.getByRole('button', { name: /parametrización/i }));

    expect(screen.getByRole('link', { name: /artículos/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /muestras/i })).not.toBeInTheDocument();
  });

  it('hides Muestras from OPERARIO (no Parametrización group at all)', () => {
    renderWithAuth(<Sidebar />, { user: operario, initialEntries: ['/dashboard'] });

    expect(screen.queryByRole('button', { name: /parametrización/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /muestras/i })).not.toBeInTheDocument();
  });

  it('opens Parametrización by default when the current path is /dashboard/muestras', () => {
    renderWithAuth(<Sidebar />, { user: admin, initialEntries: ['/dashboard/muestras'] });

    expect(screen.getByRole('link', { name: /muestras/i })).toBeInTheDocument();
  });

  it('does not open Parametrización for the tablet free-samples path', () => {
    renderWithAuth(<Sidebar />, { user: admin, initialEntries: ['/tablet/muestras-libres'] });

    expect(screen.queryByRole('link', { name: /muestras/i })).not.toBeInTheDocument();
  });

  // ── ux-polish Task 2: header/avatar reorder ───────────────────────────────

  it('places the avatar+logout block above the nav and the title at the bottom', () => {
    const { container } = renderWithAuth(<Sidebar />, { user: admin, initialEntries: ['/dashboard'] });
    const aside = container.querySelector('aside');
    expect(aside).not.toBeNull();

    // The avatar block (with the user name) must appear BEFORE the <nav>.
    const avatarText = screen.getByText('admin');
    const nav = aside!.querySelector('nav');
    expect(aside!.querySelector('nav')).not.toBeNull();
    // Compare document positions: avatar's container should precede the nav.
    const avatarBlock = avatarText.closest('div.p-4') ?? avatarText.parentElement;
    expect(avatarBlock!.compareDocumentPosition(nav!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);

    // The title "Control de Pesaje" and the "MaciaSoft v1.0" version line
    // must appear AFTER the <nav>.
    const title = screen.getByText('Control de Pesaje');
    const version = screen.getByText('MaciaSoft v1.0');
    expect(nav!.compareDocumentPosition(title)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(nav!.compareDocumentPosition(version)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});
