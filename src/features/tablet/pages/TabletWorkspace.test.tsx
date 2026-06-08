import { screen } from '@testing-library/react';
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
  lineaId: 1,
};

describe('TabletWorkspace', () => {
  it('llama a deactivateLayer2Session al hacer click en Salir', async () => {
    const { authValue } = renderWithAuth(<TabletWorkspace />, { user: operarioUser });
    const btnSalir = await screen.findByRole('button', { name: /salir/i });
    await userEvent.click(btnSalir);
    expect(authValue.deactivateLayer2Session).toHaveBeenCalledWith(1);
  });
});
