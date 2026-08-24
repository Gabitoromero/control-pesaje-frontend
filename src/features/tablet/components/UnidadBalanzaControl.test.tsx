import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders } from '../../../test/render';
import { UnidadBalanzaControl } from './UnidadBalanzaControl';
import { dispositivosApi } from '../../../api/dispositivos';

vi.mock('../../../api/dispositivos', () => ({
  dispositivosApi: {
    updateUnidad: vi.fn(),
  },
}));

describe('UnidadBalanzaControl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the currently active unit as selected', () => {
    renderWithProviders(
      <UnidadBalanzaControl hardwareId="HW-1" unidad="kg" disabled={false} variant="primary" />
    );

    const kgOption = screen.getByRole('button', { name: /kg/i });
    expect(kgOption).toHaveAttribute('aria-pressed', 'true');
    const gOption = screen.getByRole('button', { name: /^g$/i });
    expect(gOption).toHaveAttribute('aria-pressed', 'false');
  });

  it('is disabled when there is no hardwareId yet (device not paired/connected)', () => {
    renderWithProviders(
      <UnidadBalanzaControl hardwareId={undefined} unidad={undefined} disabled={false} variant="primary" />
    );

    expect(screen.getByRole('button', { name: /^g$/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /kg/i })).toBeDisabled();
  });

  it('confirms then calls updateUnidad when the operator taps the inactive option', async () => {
    vi.mocked(dispositivosApi.updateUnidad).mockResolvedValue({
      hardwareId: 'HW-1',
      nombre: '',
      lineaId: 1,
      lineaNombre: null,
      estado: 'Conectado',
      ultimaConexionAt: null,
      unidad: 'g',
    });

    const user = userEvent.setup();
    renderWithProviders(
      <UnidadBalanzaControl hardwareId="HW-1" unidad="kg" disabled={false} variant="primary" />
    );

    await user.click(screen.getByRole('button', { name: /^g$/i }));

    const confirmButton = await screen.findByRole('button', { name: /confirmar/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(dispositivosApi.updateUnidad).toHaveBeenCalledWith('HW-1', 'g');
    });
  });

  it('does not optimistically flip the displayed unit when the update call is rejected', async () => {
    vi.mocked(dispositivosApi.updateUnidad).mockRejectedValue(new Error('network error'));

    const user = userEvent.setup();
    renderWithProviders(
      <UnidadBalanzaControl hardwareId="HW-1" unidad="kg" disabled={false} variant="primary" />
    );

    await user.click(screen.getByRole('button', { name: /^g$/i }));
    const confirmButton = await screen.findByRole('button', { name: /confirmar/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(dispositivosApi.updateUnidad).toHaveBeenCalled();
    });

    // Warning alert shown on failure
    expect(await screen.findByText('No se pudo cambiar la unidad')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /aceptar/i }));

    // Still shows kg as active — no local optimistic flip, unidad prop unchanged
    // until a server-confirmed balanza-status refresh updates the parent's prop.
    await waitFor(() => {
      const kgOption = screen.getByRole('button', { name: /kg/i });
      expect(kgOption).toHaveAttribute('aria-pressed', 'true');
      const gOption = screen.getByRole('button', { name: /^g$/i });
      expect(gOption).toHaveAttribute('aria-pressed', 'false');
    });
  });

  it('does not call updateUnidad when the operator cancels the confirmation', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <UnidadBalanzaControl hardwareId="HW-1" unidad="kg" disabled={false} variant="primary" />
    );

    await user.click(screen.getByRole('button', { name: /^g$/i }));
    const cancelButton = await screen.findByRole('button', { name: /cancelar/i });
    await user.click(cancelButton);

    expect(dispositivosApi.updateUnidad).not.toHaveBeenCalled();
  });
});
