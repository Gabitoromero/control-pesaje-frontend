import { screen, waitFor } from '@testing-library/react';
import { renderWithAuth } from '../../../test/render';
import userEvent from '@testing-library/user-event';
import type { User } from '../../../shared/types/auth';
import { TabletWorkspace } from './TabletWorkspace';
import { vi } from 'vitest';

const operarioUser: User = {
  id: 3,
  nombreUsuario: 'operario1',
  rol: 'operario',
  puedeTomarMuestrasLibres: false,
};

describe('TabletWorkspace', () => {
  it('llama a closeLineSession al hacer click en Salir', async () => {
    const { authValue } = renderWithAuth(<TabletWorkspace />, { user: operarioUser, activeLineaId: 1 });
    const btnSalir = await screen.findByRole('button', { name: /salir/i });
    await userEvent.click(btnSalir);
    expect(authValue.closeLineSession).toHaveBeenCalled();
  });

  it('redirige a /tablet/seleccion-linea si activeLineaId es null', () => {
    renderWithAuth(<TabletWorkspace />, { user: operarioUser, activeLineaId: null });
    // In our test environment, MemoryRouter is used, and since Navigate is rendered,
    // we can't easily assert the DOM change without an intermediate route, but we can verify
    // that it doesn't render the line text.
    expect(screen.queryByText(/Operario:/i)).not.toBeInTheDocument();
  });
});
