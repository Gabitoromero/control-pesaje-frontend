import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithAuth } from '../../../test/render';
import { PlantaModeSwitch } from './PlantaModeSwitch';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

const userWithRole = (rol: 'operario' | 'jefe' | 'administrador' | 'visualizacion') => ({
  id: 3,
  legajo: 'L1',
  nombreUsuario: 'usuario1',
  rol,
  puedeTomarMuestrasLibres: false,
});

describe('PlantaModeSwitch', () => {
  beforeEach(() => navigateMock.mockClear());

  it.each(['operario', 'jefe', 'administrador'] as const)('is shown to %s', rol => {
    renderWithAuth(<PlantaModeSwitch />, { user: userWithRole(rol), initialEntries: ['/tablet/pasadas'] });

    expect(screen.getByRole('button', { name: 'Pasadas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mi historial' })).toBeInTheDocument();
  });

  it('is hidden for the visualizacion role', () => {
    renderWithAuth(<PlantaModeSwitch />, { user: userWithRole('visualizacion'), initialEntries: ['/tablet/pasadas'] });

    expect(screen.queryByRole('button', { name: 'Mi historial' })).not.toBeInTheDocument();
  });

  it('is hidden without a session', () => {
    renderWithAuth(<PlantaModeSwitch />, { initialEntries: ['/tablet/pasadas'] });

    expect(screen.queryByRole('group', { name: 'Vista de Planta' })).not.toBeInTheDocument();
  });

  it('marks Pasadas as active in the pasadas flow and navigates to the history', async () => {
    renderWithAuth(<PlantaModeSwitch />, { user: userWithRole('operario'), initialEntries: ['/tablet/muestras-libres'] });

    expect(screen.getByRole('button', { name: 'Pasadas' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Mi historial' })).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(screen.getByRole('button', { name: 'Mi historial' }));
    expect(navigateMock).toHaveBeenCalledWith('/tablet/historial');
  });

  it('marks Mi historial as active on the history route and navigates back to pasadas', async () => {
    renderWithAuth(<PlantaModeSwitch />, { user: userWithRole('jefe'), initialEntries: ['/tablet/historial'] });

    expect(screen.getByRole('button', { name: 'Mi historial' })).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(screen.getByRole('button', { name: 'Pasadas' }));
    expect(navigateMock).toHaveBeenCalledWith('/tablet/pasadas');
  });

  it('does not navigate when clicking the already active option', async () => {
    renderWithAuth(<PlantaModeSwitch />, { user: userWithRole('operario'), initialEntries: ['/tablet/historial'] });

    await userEvent.click(screen.getByRole('button', { name: 'Mi historial' }));
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
