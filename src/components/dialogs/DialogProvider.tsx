import React, { createContext, useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

export interface AlertOptions {
  title: string;
  description?: string;
}

export interface DialogContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alertError: (options: AlertOptions) => Promise<void>;
  alertSuccess: (options: AlertOptions) => Promise<void>;
  alertWarning: (options: AlertOptions) => Promise<void>;
}

type DialogKind = 'confirm' | 'error' | 'success' | 'warning';

interface ConfirmRequest {
  kind: 'confirm';
  options: ConfirmOptions;
  // Idempotent — Radix's AlertDialogAction/Cancel both trigger the dialog's own
  // onOpenChange(false) close in addition to any onClick handler, so this can
  // be called more than once for the same request. Only the first call wins.
  resolve: (value: boolean) => void;
  previouslyFocused: HTMLElement | null;
}

interface AlertRequest {
  kind: Exclude<DialogKind, 'confirm'>;
  options: AlertOptions;
  resolve: () => void;
  previouslyFocused: HTMLElement | null;
}

type DialogRequest = ConfirmRequest | AlertRequest;

const destructiveActionClass = 'bg-destructive text-destructive-foreground hover:bg-destructive/90';

// eslint-disable-next-line react-refresh/only-export-components
export const DialogContext = createContext<DialogContextType | undefined>(undefined);

/**
 * Wraps a resolver so it only ever takes effect once. Needed because a single
 * request can be settled from more than one code path (an explicit action
 * click AND the dialog's onOpenChange(false) close that Radix fires right
 * after), and because on provider unmount we force-settle anything still
 * pending — without this guard a request could be resolved twice with
 * different values.
 */
function settleOnce<T>(resolve: (value: T) => void): (value: T) => void {
  let settled = false;
  return (value: T) => {
    if (settled) return;
    settled = true;
    resolve(value);
  };
}

export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // A FIFO queue, not a single slot: if confirm()/alertX() is called again
  // before the current request settles, the new request is queued instead of
  // silently replacing (and orphaning the promise of) the current one. Only
  // queue[0] is ever rendered/visible.
  //
  // `queueRef` is kept in sync SYNCHRONOUSLY (not via a useEffect keyed on
  // `queue`) so unmount cleanup — which must read the latest queue without
  // depending on React having committed/flushed a render first — always sees
  // an up-to-date snapshot.
  const [queue, setQueue] = useState<DialogRequest[]>([]);
  const queueRef = useRef<DialogRequest[]>(queue);

  // Radix's Modal AlertDialog only auto-restores focus to an `AlertDialogTrigger`
  // co-located with the content (it calls context.triggerRef.current?.focus()
  // and always preventDefault()s FocusScope's generic restore). Our API is
  // imperative — confirm()/alertX() can be called from any element, so there is
  // no static Trigger. We capture the active element per-request ourselves and
  // restore it via our own onCloseAutoFocus handler below.
  const focusRestoreTargetRef = useRef<HTMLElement | null>(null);

  const current = queue[0] ?? null;

  const enqueue = useCallback((request: DialogRequest) => {
    queueRef.current = [...queueRef.current, request];
    setQueue(queueRef.current);
  }, []);

  const dequeue = useCallback((request: DialogRequest) => {
    if (queueRef.current[0] !== request) return;
    queueRef.current = queueRef.current.slice(1);
    setQueue(queueRef.current);
  }, []);

  const confirm = useCallback(
    (options: ConfirmOptions) => {
      return new Promise<boolean>((resolve) => {
        enqueue({
          kind: 'confirm',
          options,
          resolve: settleOnce(resolve),
          previouslyFocused: document.activeElement as HTMLElement | null,
        });
      });
    },
    [enqueue]
  );

  const alertOfKind = useCallback(
    (kind: Exclude<DialogKind, 'confirm'>, options: AlertOptions) => {
      return new Promise<void>((resolve) => {
        enqueue({
          kind,
          options,
          resolve: settleOnce(resolve),
          previouslyFocused: document.activeElement as HTMLElement | null,
        });
      });
    },
    [enqueue]
  );

  const alertError = useCallback((options: AlertOptions) => alertOfKind('error', options), [alertOfKind]);
  const alertSuccess = useCallback((options: AlertOptions) => alertOfKind('success', options), [alertOfKind]);
  const alertWarning = useCallback((options: AlertOptions) => alertOfKind('warning', options), [alertOfKind]);

  // Force-settle anything still pending on unmount (single app-wide mount
  // point today, but this closes the loop rather than leaving a hung await).
  useEffect(() => {
    return () => {
      for (const request of queueRef.current) {
        if (request.kind === 'confirm') {
          request.resolve(false);
        } else {
          request.resolve();
        }
      }
    };
  }, []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) return;
      const head = queueRef.current[0];
      if (!head) return;
      if (head.kind === 'confirm') {
        head.resolve(false);
      } else {
        head.resolve();
      }
      focusRestoreTargetRef.current = head.previouslyFocused;
      dequeue(head);
    },
    [dequeue]
  );

  const handleConfirmClick = () => {
    if (current?.kind === 'confirm') {
      current.resolve(true);
    }
  };

  const handleCloseAutoFocus = useCallback((event: Event) => {
    event.preventDefault();
    focusRestoreTargetRef.current?.focus();
  }, []);

  return (
    <DialogContext.Provider value={{ confirm, alertError, alertSuccess, alertWarning }}>
      {children}
      <AlertDialog open={current !== null} onOpenChange={handleOpenChange}>
        <AlertDialogContent onCloseAutoFocus={handleCloseAutoFocus}>
          <AlertDialogHeader>
            <AlertDialogTitle>{current?.options.title}</AlertDialogTitle>
            {current?.options.description && (
              <AlertDialogDescription>{current.options.description}</AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            {current?.kind === 'confirm' ? (
              <>
                <AlertDialogCancel>{current.options.cancelText ?? 'Cancelar'}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmClick}
                  className={current.options.variant === 'destructive' ? destructiveActionClass : undefined}
                >
                  {current.options.confirmText ?? 'Confirmar'}
                </AlertDialogAction>
              </>
            ) : (
              current && <AlertDialogAction>Aceptar</AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DialogContext.Provider>
  );
};
