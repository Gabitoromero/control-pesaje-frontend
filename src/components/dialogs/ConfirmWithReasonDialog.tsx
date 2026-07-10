import { useState } from 'react';

export type DialogField =
  | { kind: 'reason'; label: string; placeholder?: string }
  | { kind: 'select'; label: string; placeholder?: string; options: { value: string; label: string }[] };

export interface ConfirmWithReasonDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  field: DialogField;
  confirmText: string;
  cancelText?: string;
  variant?: 'destructive' | 'default';
  onConfirm: (value: string) => Promise<void>;
  onClose: () => void;
}

function DialogContent({
  title,
  description,
  field,
  confirmText,
  cancelText = 'Cancelar',
  variant = 'default',
  onConfirm,
  onClose,
}: Omit<ConfirmWithReasonDialogProps, 'isOpen'>) {
  const [value, setValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmedValue = value.trim();
  const canConfirm =
    field.kind === 'reason' ? trimmedValue.length > 0 && !isSubmitting : value !== '' && !isSubmitting;

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setIsSubmitting(true);
    try {
      await onConfirm(field.kind === 'reason' ? trimmedValue : value);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md flex flex-col min-h-0 max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
          <div>
            <label
              htmlFor="confirm-with-reason-field"
              className="block text-sm text-muted-foreground mb-1"
            >
              {field.label}
            </label>
            {field.kind === 'reason' ? (
              <textarea
                id="confirm-with-reason-field"
                className="w-full min-h-[80px] bg-background border border-border rounded-lg p-3 text-foreground text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={field.placeholder}
              />
            ) : (
              <select
                id="confirm-with-reason-field"
                className="w-full bg-background border border-border rounded-lg p-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              >
                <option value="" disabled>
                  {field.placeholder}
                </option>
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg text-muted-foreground hover:bg-accent transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              variant === 'destructive'
                ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Reusable confirm modal that requires a non-empty reason before the confirm
 * action becomes available. Mirrors MuestraObservacionPopup's custom modal
 * shell (fixed overlay + card + textarea state); not built on top of
 * useDialog() since that primitive is yes/no-only with no text input.
 */
export function ConfirmWithReasonDialog(props: ConfirmWithReasonDialogProps) {
  if (!props.isOpen) return null;
  return <DialogContent {...props} />;
}
