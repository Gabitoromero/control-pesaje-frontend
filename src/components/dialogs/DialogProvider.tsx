import React, { createContext, useCallback, useRef, useState } from 'react';
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
  resolve: (value: boolean) => void;
}

interface AlertRequest {
  kind: Exclude<DialogKind, 'confirm'>;
  options: AlertOptions;
  resolve: () => void;
}

type DialogRequest = ConfirmRequest | AlertRequest;

const destructiveActionClass = 'bg-destructive text-destructive-foreground hover:bg-destructive/90';

// eslint-disable-next-line react-refresh/only-export-components
export const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [request, setRequest] = useState<DialogRequest | null>(null);
  // Tracks which action the user picked before Radix's AlertDialogAction/Cancel
  // fire their own onOpenChange(false) close — avoids resolving the promise twice.
  const confirmedRef = useRef(false);
  // Radix's Modal AlertDialog only auto-restores focus to an `AlertDialogTrigger`
  // co-located with the content (it calls context.triggerRef.current?.focus()
  // and always preventDefault()s FocusScope's generic restore). Our API is
  // imperative — confirm()/alertX() can be called from any element, so there is
  // no static Trigger. We capture the active element ourselves and restore it
  // via our own onCloseAutoFocus handler below.
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      confirmedRef.current = false;
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
      setRequest({ kind: 'confirm', options, resolve });
    });
  }, []);

  const alertOfKind = useCallback((kind: Exclude<DialogKind, 'confirm'>, options: AlertOptions) => {
    return new Promise<void>((resolve) => {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
      setRequest({ kind, options, resolve });
    });
  }, []);

  const alertError = useCallback((options: AlertOptions) => alertOfKind('error', options), [alertOfKind]);
  const alertSuccess = useCallback((options: AlertOptions) => alertOfKind('success', options), [alertOfKind]);
  const alertWarning = useCallback((options: AlertOptions) => alertOfKind('warning', options), [alertOfKind]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) return;
      setRequest((current) => {
        if (!current) return null;
        if (current.kind === 'confirm') {
          current.resolve(confirmedRef.current);
        } else {
          current.resolve();
        }
        return null;
      });
    },
    []
  );

  const handleConfirmClick = () => {
    confirmedRef.current = true;
  };

  const handleCloseAutoFocus = useCallback((event: Event) => {
    event.preventDefault();
    previouslyFocusedRef.current?.focus();
  }, []);

  return (
    <DialogContext.Provider value={{ confirm, alertError, alertSuccess, alertWarning }}>
      {children}
      <AlertDialog open={request !== null} onOpenChange={handleOpenChange}>
        <AlertDialogContent onCloseAutoFocus={handleCloseAutoFocus}>
          <AlertDialogHeader>
            <AlertDialogTitle>{request?.options.title}</AlertDialogTitle>
            {request?.options.description && (
              <AlertDialogDescription>{request.options.description}</AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            {request?.kind === 'confirm' ? (
              <>
                <AlertDialogCancel>{request.options.cancelText ?? 'Cancelar'}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleConfirmClick}
                  className={request.options.variant === 'destructive' ? destructiveActionClass : undefined}
                >
                  {request.options.confirmText ?? 'Confirmar'}
                </AlertDialogAction>
              </>
            ) : (
              request && <AlertDialogAction>Aceptar</AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DialogContext.Provider>
  );
};
