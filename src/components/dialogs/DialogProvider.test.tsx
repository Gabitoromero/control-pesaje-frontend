import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect, useState } from 'react';
import { DialogProvider } from './DialogProvider';
import type { DialogContextType } from './DialogProvider';
import { useDialog } from './useDialog';

function ConfirmHarness() {
  const { confirm } = useDialog();
  const [result, setResult] = useState('idle');

  return (
    <>
      <button
        onClick={async () => {
          const ok = await confirm({
            title: '¿Eliminar usuario?',
            description: 'Esta acción no se puede deshacer.',
            variant: 'destructive',
          });
          setResult(ok ? 'confirmed' : 'cancelled');
        }}
      >
        Trigger confirm
      </button>
      <span data-testid="result">{result}</span>
    </>
  );
}

function AlertHarness({ kind }: { kind: 'error' | 'success' | 'warning' }) {
  const { alertError, alertSuccess, alertWarning } = useDialog();
  const [result, setResult] = useState('idle');

  const trigger = kind === 'error' ? alertError : kind === 'success' ? alertSuccess : alertWarning;

  return (
    <>
      <button
        onClick={async () => {
          await trigger({ title: `Título ${kind}`, description: `Descripción ${kind}` });
          setResult('acknowledged');
        }}
      >
        Trigger {kind}
      </button>
      <span data-testid="result">{result}</span>
    </>
  );
}

function QueueHarness() {
  const { confirm } = useDialog();
  const [results, setResults] = useState<string[]>([]);

  return (
    <>
      <button
        onClick={() => {
          // Fire both without awaiting the first — reproduces the
          // single-slot orphaning bug when done naively.
          confirm({ title: 'First' }).then((ok) => setResults((r) => [...r, `first:${ok}`]));
          confirm({ title: 'Second' }).then((ok) => setResults((r) => [...r, `second:${ok}`]));
        }}
      >
        Trigger both
      </button>
      <ul>
        {results.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </>
  );
}

function UnmountHarness({ onReady }: { onReady: (dialog: DialogContextType) => void }) {
  const dialog = useDialog();
  useEffect(() => {
    onReady(dialog);
  }, [dialog, onReady]);
  return null;
}

describe('DialogProvider / useDialog', () => {
  it('confirm() resolves true when the user clicks the confirm action', async () => {
    const user = userEvent.setup();
    render(
      <DialogProvider>
        <ConfirmHarness />
      </DialogProvider>
    );

    await user.click(screen.getByText('Trigger confirm'));

    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveAccessibleName('¿Eliminar usuario?');
    expect(screen.getByText('Esta acción no se puede deshacer.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(await screen.findByTestId('result')).toHaveTextContent('confirmed');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('confirm() resolves false when the user clicks cancel', async () => {
    const user = userEvent.setup();
    render(
      <DialogProvider>
        <ConfirmHarness />
      </DialogProvider>
    );

    await user.click(screen.getByText('Trigger confirm'));
    await screen.findByRole('alertdialog');

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(await screen.findByTestId('result')).toHaveTextContent('cancelled');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('confirm() resolves false when the user presses Escape', async () => {
    const user = userEvent.setup();
    render(
      <DialogProvider>
        <ConfirmHarness />
      </DialogProvider>
    );

    await user.click(screen.getByText('Trigger confirm'));
    await screen.findByRole('alertdialog');

    await user.keyboard('{Escape}');

    expect(await screen.findByTestId('result')).toHaveTextContent('cancelled');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('restores focus to the trigger button after the dialog closes', async () => {
    const user = userEvent.setup();
    render(
      <DialogProvider>
        <ConfirmHarness />
      </DialogProvider>
    );

    const trigger = screen.getByText('Trigger confirm');
    await user.click(trigger);
    await screen.findByRole('alertdialog');

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('applies destructive styling to the confirm action when variant is destructive', async () => {
    const user = userEvent.setup();
    render(
      <DialogProvider>
        <ConfirmHarness />
      </DialogProvider>
    );

    await user.click(screen.getByText('Trigger confirm'));
    const action = await screen.findByRole('button', { name: 'Confirmar' });
    expect(action.className).toContain('bg-destructive');
  });

  it.each(['error', 'success', 'warning'] as const)(
    '%s alert dialog renders title/description and resolves on acknowledge',
    async (kind) => {
    const user = userEvent.setup();
    render(
      <DialogProvider>
        <AlertHarness kind={kind} />
      </DialogProvider>
    );

    await user.click(screen.getByText(`Trigger ${kind}`));

    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveAccessibleName(`Título ${kind}`);
    expect(screen.getByText(`Descripción ${kind}`)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Aceptar' }));

    expect(await screen.findByTestId('result')).toHaveTextContent('acknowledged');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    }
  );

  it('queues a second confirm() call instead of orphaning the first when called concurrently', async () => {
    const user = userEvent.setup();
    render(
      <DialogProvider>
        <QueueHarness />
      </DialogProvider>
    );

    await user.click(screen.getByText('Trigger both'));

    let dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveAccessibleName('First');

    await user.click(screen.getByRole('button', { name: 'Confirmar' }));

    await waitFor(() => expect(screen.getByText('first:true')).toBeInTheDocument());

    dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveAccessibleName('Second');

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    await waitFor(() => expect(screen.getByText('second:false')).toBeInTheDocument());
  });

  it('resolves all pending requests instead of hanging forever when the provider unmounts', async () => {
    let captured: DialogContextType | null = null;
    const { unmount } = render(
      <DialogProvider>
        <UnmountHarness
          onReady={(dialog) => {
            captured = dialog;
          }}
        />
      </DialogProvider>
    );

    await waitFor(() => expect(captured).not.toBeNull());

    const confirmPromise = captured!.confirm({ title: 'Pending confirm' });
    const alertPromise = captured!.alertError({ title: 'Pending alert' });

    unmount();

    await expect(confirmPromise).resolves.toBe(false);
    await expect(alertPromise).resolves.toBeUndefined();
  });

  it('useDialog throws when used outside a DialogProvider', () => {
    // Suppress the expected React error boundary console noise for this assertion.
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    function Bare() {
      useDialog();
      return null;
    }

    expect(() => render(<Bare />)).toThrow('useDialog must be used within a DialogProvider');

    consoleSpy.mockRestore();
  });
});
