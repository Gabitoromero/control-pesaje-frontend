import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { renderWithProviders } from '../../../test/render';
import { LineaParadaButton } from './LineaParadaButton';
import { registrarLineaParada } from '../../../api/pasadas';

vi.mock('../../../api/pasadas', () => ({
  registrarLineaParada: vi.fn(),
}));

describe('LineaParadaButton', () => {
  beforeEach(() => {
    vi.mocked(registrarLineaParada).mockReset();
  });

  it('opens the reason dialog and keeps confirm disabled while the observation is empty', async () => {
    renderWithProviders(<LineaParadaButton lineaProduccionId={7} />);

    await userEvent.click(screen.getByRole('button', { name: /línea parada/i }));
    const dialog = screen.getByRole('dialog', { name: 'Línea parada' });
    expect(within(dialog).getByRole('button', { name: 'Confirmar' })).toBeDisabled();

    await userEvent.type(within(dialog).getByLabelText('Observación'), '   ');
    expect(within(dialog).getByRole('button', { name: 'Confirmar' })).toBeDisabled();
    expect(registrarLineaParada).not.toHaveBeenCalled();
  });

  it('registers the parada with the trimmed observation and notifies the page', async () => {
    vi.mocked(registrarLineaParada).mockResolvedValue({ id: 1, estado: 'parada' } as never);
    const onRegistrada = vi.fn();
    renderWithProviders(<LineaParadaButton lineaProduccionId={7} onRegistrada={onRegistrada} />);

    await userEvent.click(screen.getByRole('button', { name: /línea parada/i }));
    const dialog = screen.getByRole('dialog', { name: 'Línea parada' });
    await userEvent.type(within(dialog).getByLabelText('Observación'), '  Sin energía ');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirmar' }));

    await waitFor(() =>
      expect(registrarLineaParada).toHaveBeenCalledWith({ lineaProduccionId: 7, observacion: 'Sin energía' })
    );
    await waitFor(() => expect(onRegistrada).toHaveBeenCalledTimes(1));
  });

  it('shows the backend error and does not notify the page when it fails', async () => {
    vi.mocked(registrarLineaParada).mockRejectedValue(new Error('boom'));
    const onRegistrada = vi.fn();
    renderWithProviders(<LineaParadaButton lineaProduccionId={7} onRegistrada={onRegistrada} />);

    await userEvent.click(screen.getByRole('button', { name: /línea parada/i }));
    const dialog = screen.getByRole('dialog', { name: 'Línea parada' });
    await userEvent.type(within(dialog).getByLabelText('Observación'), 'Motivo');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Confirmar' }));

    expect(await screen.findByText('No se pudo registrar la línea parada')).toBeInTheDocument();
    expect(onRegistrada).not.toHaveBeenCalled();
  });
});
