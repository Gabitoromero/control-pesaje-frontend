import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import type { Muestra } from '../../../shared/types/domain';
import { useDialog } from '../../../components/dialogs/useDialog';

export interface MuestraObservacionPopupProps {
  muestra: Muestra;
  index: number;
  isOpen: boolean;
  onSave: (index: number, observacion: string) => Promise<void>;
  onDelete: (index: number) => Promise<void>;
  onClose: () => void;
}

function PopupContent({
  muestra,
  index,
  onSave,
  onDelete,
  onClose,
}: Omit<MuestraObservacionPopupProps, 'isOpen'>) {
  const [observacion, setObservacion] = useState(muestra.observacion ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const { confirm } = useDialog();

  const isOk = muestra.estadoValidacion === 'ok';

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(index, observacion);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: '¿Está seguro de eliminar esta muestra?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'destructive',
    });
    if (!confirmed) return;
    await onDelete(index);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Detalle de muestra #${index + 1}`}
    >
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md flex flex-col min-h-0 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">
            Muestra #{index + 1}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content: read-only info + editable observation */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {/* Read-only sample info */}
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Peso</span>
              <span className="text-2xl font-black tabular-nums text-foreground">
                {muestra.pesoNeto.toFixed(3)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Validación</span>
              <span
                className={`text-xs px-3 py-1 rounded-full font-medium ${
                  isOk
                    ? 'bg-success-muted text-success'
                    : 'bg-danger-muted text-danger'
                }`}
              >
                {muestra.estadoValidacion}
              </span>
            </div>
          </div>

          {/* Editable observation */}
          <div className="px-4 pb-4">
            <label
              htmlFor="muestra-observacion"
              className="block text-sm text-muted-foreground mb-1"
            >
              Observación
            </label>
            <textarea
              id="muestra-observacion"
              className="w-full min-h-[80px] bg-background border border-border rounded-lg p-3 text-foreground text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              placeholder="Sin observaciones"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 p-4 border-t border-border">
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-danger hover:bg-danger-muted transition-colors text-sm font-medium"
            aria-label="Eliminar muestra"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar
          </button>

          <div className="flex-1" />

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-muted-foreground hover:bg-accent transition-colors text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground text-sm font-bold transition-colors"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Controlled popup that displays read-only sample info (number, weight,
 * validation badge) and an editable observation textarea. Uses `key` to
 * force remount when a different muestra is opened, avoiding setState-in-effect.
 */
export function MuestraObservacionPopup(props: MuestraObservacionPopupProps) {
  if (!props.isOpen) return null;
  return <PopupContent key={props.muestra.id ?? props.index} {...props} />;
}
