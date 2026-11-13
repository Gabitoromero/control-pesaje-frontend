import type { ReactNode } from 'react';
import { History } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';

export interface DetailField {
  label: string;
  value: ReactNode;
}

interface EntityDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  fields: DetailField[];
  /** When provided, a button to jump to the change history is shown. */
  onViewHistorial?: () => void;
}

const isEmpty = (value: ReactNode) => value === null || value === undefined || value === '' || value === false;

/** Read-only side panel that shows every field of a list row without truncation. */
export const EntityDetailDrawer = ({ open, onOpenChange, title, subtitle, fields, onViewHistorial }: EntityDetailDrawerProps) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent className="overflow-y-auto">
      <SheetTitle className="text-lg font-semibold">{title}</SheetTitle>
      <SheetDescription className="text-sm text-muted-foreground">{subtitle ?? 'Datos completos'}</SheetDescription>

      <dl className="space-y-4">
        {fields.map((field) => (
          <div key={field.label}>
            <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{field.label}</dt>
            <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground">{isEmpty(field.value) ? '-' : field.value}</dd>
          </div>
        ))}
      </dl>

      {onViewHistorial && (
        <button
          type="button"
          onClick={onViewHistorial}
          className="mt-auto flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2 text-sm text-foreground hover:bg-accent"
        >
          <History size={16} /> Ver historial de cambios
        </button>
      )}
    </SheetContent>
  </Sheet>
);
