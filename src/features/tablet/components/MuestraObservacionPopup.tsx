import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import type { Muestra } from '../../../shared/types/domain';

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
    const confirmed = window.confirm('¿Está seguro de eliminar esta muestra?');
    if (!confirmed) return;
    await onDelete(index);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Detalle de muestra #${index + 1}`}
    >
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h3 className="text-lg font-bold text-white">
            Muestra #{index + 1}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Read-only sample info */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Peso</span>
            <span className="text-2xl font-black tabular-nums text-white">
              {muestra.pesoNeto.toFixed(3)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Validación</span>
            <span
              className={`text-xs px-3 py-1 rounded-full font-medium ${
                isOk
                  ? 'bg-green-900/50 text-green-400'
                  : 'bg-red-900/50 text-red-400'
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
            className="block text-sm text-slate-400 mb-1"
          >
            Observación
          </label>
          <textarea
            id="muestra-observacion"
            className="w-full min-h-[80px] bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            placeholder="Sin observaciones"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 p-4 border-t border-slate-700">
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-red-400 hover:bg-red-900/30 transition-colors text-sm font-medium"
            aria-label="Eliminar muestra"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar
          </button>

          <div className="flex-1" />

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors"
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
