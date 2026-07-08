import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfirmWithReasonDialog } from './ConfirmWithReasonDialog';
import { renderWithProviders } from '../../test/render';

describe('ConfirmWithReasonDialog', () => {
  const onConfirm = vi.fn().mockResolvedValue(undefined);
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    onConfirm.mockResolvedValue(undefined);
  });

  const renderDialog = (overrides: Partial<React.ComponentProps<typeof ConfirmWithReasonDialog>> = {}) =>
    renderWithProviders(
      <ConfirmWithReasonDialog
        isOpen
        title="Abortar Pasada"
        description="Esta acción no se puede deshacer."
        reasonLabel="Motivo"
        confirmText="Confirmar"
        onConfirm={onConfirm}
        onClose={onClose}
        {...overrides}
      />
    );

  it('renders nothing when isOpen is false', () => {
    renderDialog({ isOpen: false });
    expect(screen.queryByText('Abortar Pasada')).not.toBeInTheDocument();
  });

  it('renders title and description', () => {
    renderDialog();
    expect(screen.getByText('Abortar Pasada')).toBeInTheDocument();
    expect(screen.getByText('Esta acción no se puede deshacer.')).toBeInTheDocument();
  });

  it('disables confirm when reason is empty', () => {
    renderDialog();
    expect(screen.getByRole('button', { name: /confirmar/i })).toBeDisabled();
  });

  it('disables confirm when reason is whitespace-only', async () => {
    const user = userEvent.setup();
    renderDialog();
    await user.type(screen.getByRole('textbox'), '   ');
    expect(screen.getByRole('button', { name: /confirmar/i })).toBeDisabled();
  });

  it('enables confirm once non-empty text is entered', async () => {
    const user = userEvent.setup();
    renderDialog();
    await user.type(screen.getByRole('textbox'), 'Motivo válido');
    expect(screen.getByRole('button', { name: /confirmar/i })).toBeEnabled();
  });

  it('calls onConfirm with the trimmed reason text', async () => {
    const user = userEvent.setup();
    renderDialog();
    await user.type(screen.getByRole('textbox'), '  Motivo con espacios  ');
    await user.click(screen.getByRole('button', { name: /confirmar/i }));
    expect(onConfirm).toHaveBeenCalledWith('Motivo con espacios');
  });

  it('calls onClose without calling onConfirm when cancel is clicked', async () => {
    const user = userEvent.setup();
    renderDialog();
    await user.type(screen.getByRole('textbox'), 'Motivo válido');
    await user.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(onClose).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('keeps the modal open and shows a disabled state while onConfirm resolves', async () => {
    const user = userEvent.setup();
    let resolvePromise: () => void = () => {};
    onConfirm.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolvePromise = resolve;
        })
    );

    renderDialog();
    await user.type(screen.getByRole('textbox'), 'Motivo válido');
    await user.click(screen.getByRole('button', { name: /confirmar/i }));

    expect(screen.getByRole('button', { name: /confirmar/i })).toBeDisabled();

    resolvePromise();
  });
});
