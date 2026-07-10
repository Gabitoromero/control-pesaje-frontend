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
        field={{ kind: 'reason', label: 'Motivo' }}
        confirmText="Confirmar"
        onConfirm={onConfirm}
        onClose={onClose}
        {...overrides}
      />
    );

  describe('reason mode', () => {
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

  describe('select mode', () => {
    const selectOverrides = {
      field: {
        kind: 'select' as const,
        label: 'Línea',
        placeholder: 'Seleccioná una línea',
        options: [
          { value: '1', label: 'Línea 1' },
          { value: '2', label: 'Línea 2' },
        ],
      },
    };

    it('renders a select with a disabled placeholder option', () => {
      renderDialog(selectOverrides);
      const select = screen.getByRole('combobox');
      const placeholderOption = screen.getByRole('option', { name: 'Seleccioná una línea' });
      expect(select).toHaveValue('');
      expect(placeholderOption).toBeDisabled();
    });

    it('lists the provided options', () => {
      renderDialog(selectOverrides);
      expect(screen.getByRole('option', { name: 'Línea 1' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Línea 2' })).toBeInTheDocument();
    });

    it('disables confirm until an option is chosen', async () => {
      const user = userEvent.setup();
      renderDialog(selectOverrides);
      expect(screen.getByRole('button', { name: /confirmar/i })).toBeDisabled();
      await user.selectOptions(screen.getByRole('combobox'), '2');
      expect(screen.getByRole('button', { name: /confirmar/i })).toBeEnabled();
    });

    it('calls onConfirm with the selected option value as a string', async () => {
      const user = userEvent.setup();
      renderDialog(selectOverrides);
      await user.selectOptions(screen.getByRole('combobox'), '2');
      await user.click(screen.getByRole('button', { name: /confirmar/i }));
      expect(onConfirm).toHaveBeenCalledWith('2');
    });
  });
});
