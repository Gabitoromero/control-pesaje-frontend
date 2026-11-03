import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { renderWithAuth } from '../../../test/render';
import { TabletPlantaHeader } from './TabletPlantaHeader';

const operario = {
  id: 3,
  legajo: 'O1',
  nombreUsuario: 'operario1',
  rol: 'operario' as const,
  puedeTomarMuestrasLibres: false,
};

describe('TabletPlantaHeader', () => {
  it('shows the línea name as the page title', () => {
    renderWithAuth(<TabletPlantaHeader lineaNombre="Línea Envasado Norte" onLogout={vi.fn()} />, { user: operario });

    expect(screen.getByRole('heading', { level: 1, name: 'Línea Envasado Norte' })).toBeInTheDocument();
  });

  it('identifies the user with a non-interactive avatar instead of the user name text', () => {
    renderWithAuth(<TabletPlantaHeader lineaNombre="Línea 1" onLogout={vi.fn()} />, { user: operario });

    const avatar = screen.getByRole('img', { name: 'Usuario operario1' });
    expect(avatar).toHaveTextContent('OP');
    expect(avatar.closest('button, a')).toBeNull();
    expect(screen.queryByText('operario1')).not.toBeInTheDocument();
  });

  it('has a logout button that calls onLogout', async () => {
    const onLogout = vi.fn();
    renderWithAuth(<TabletPlantaHeader lineaNombre="Línea 1" onLogout={onLogout} />, { user: operario });

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('includes the Pasadas / Mi historial switch', () => {
    renderWithAuth(<TabletPlantaHeader lineaNombre="Línea 1" onLogout={vi.fn()} />, { user: operario });

    expect(screen.getByRole('group', { name: 'Vista de Planta' })).toBeInTheDocument();
  });
});
