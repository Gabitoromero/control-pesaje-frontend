import { useState } from 'react';
import { OctagonX } from 'lucide-react';
import { registrarLineaParada } from '../../../api/pasadas';
import { ConfirmWithReasonDialog } from '../../../components/dialogs/ConfirmWithReasonDialog';
import { useDialog } from '../../../components/dialogs/useDialog';
import { getApiErrorMessage } from '../../../utils/errors';

export interface LineaParadaButtonProps {
  lineaProduccionId: number;
  /** Called after the parada was registered (the running pasada, if any, is now closed). */
  onRegistrada?: () => void;
  /** Accent color: 'primary' (cyan), 'warning' (amber) or 'destructive' (red, to set it apart from sampling actions). */
  variant?: 'primary' | 'warning' | 'destructive';
  className?: string;
}

/**
 * "Línea parada" action: asks for a mandatory observation and registers the parada.
 * If a pasada is running on the line it becomes `parada` and is closed; otherwise
 * a new pasada is registered directly as `parada`.
 */
export function LineaParadaButton({
  lineaProduccionId,
  onRegistrada,
  variant = 'primary',
  className = '',
}: LineaParadaButtonProps) {
  const { alertError, alertSuccess } = useDialog();
  const [isOpen, setIsOpen] = useState(false);

  const accent =
    variant === 'warning'
      ? 'border-warning text-warning'
      : variant === 'destructive'
        ? 'border-destructive text-destructive'
        : 'border-primary text-primary';

  const handleConfirm = async (observacion: string) => {
    try {
      await registrarLineaParada({ lineaProduccionId, observacion });
    } catch (err) {
      await alertError({
        title: 'No se pudo registrar la línea parada',
        description: getApiErrorMessage(err, 'Ocurrió un error inesperado'),
      });
      return;
    }
    setIsOpen(false);
    onRegistrada?.();
    // Not awaited: the provider outlives this component if the page navigates away.
    void alertSuccess({
      title: 'Línea parada registrada',
      description: 'Se registró la pasada como parada.',
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`min-h-11 px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all active:scale-95 ${accent} ${className}`}
      >
        <OctagonX className="inline w-4 h-4 mr-1.5 align-text-bottom" aria-hidden="true" />
        Línea parada
      </button>
      <ConfirmWithReasonDialog
        isOpen={isOpen}
        title="Línea parada"
        description="Se registrará una pasada parada, sin muestras. Si hay una pasada en curso, se cierra como parada."
        field={{
          kind: 'reason',
          label: 'Observación',
          placeholder: 'Ej: falta de materia prima, corte de energía...',
        }}
        confirmText="Confirmar"
        cancelText="Cancelar"
        onConfirm={handleConfirm}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
