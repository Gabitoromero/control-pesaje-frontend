import React, { useState } from 'react';
import { dispositivosApi } from '../../../api/dispositivos';
import type { UnidadPeso } from '../../../shared/types/domain';
import { useDialog } from '../../../components/dialogs/useDialog';

export interface UnidadBalanzaControlProps {
  hardwareId?: string;
  unidad?: UnidadPeso;
  disabled: boolean;
  /** Accent color: 'primary' (cyan) for TabletWorkspace, 'warning' (amber) for Muestras Libres. */
  variant: 'primary' | 'warning';
}

const OPTIONS: UnidadPeso[] = ['g', 'kg'];

const UNIDAD_LABEL: Record<UnidadPeso, string> = {
  g: 'g',
  kg: 'kg',
};

/**
 * Segmented g / kg toggle for correcting the source unit a physical scale
 * transmits, live, without a Raspberry reconnect. Presentational — the
 * authoritative unit always comes from the `unidad` prop, which the caller
 * derives from the server-confirmed `balanza-status` socket payload. This
 * component never flips its displayed state optimistically: on confirm it
 * only issues the PATCH request, and the toggle only ever reflects `unidad`
 * as passed in, so a rejected update leaves the display unchanged until the
 * next server-confirmed status arrives.
 */
export const UnidadBalanzaControl: React.FC<UnidadBalanzaControlProps> = ({
  hardwareId,
  unidad,
  disabled,
  variant,
}) => {
  const { confirm, alertWarning } = useDialog();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeClass = variant === 'warning' ? 'bg-warning text-warning-foreground' : 'bg-primary text-primary-foreground';
  const isControlDisabled = disabled || !hardwareId || isSubmitting;

  const handleSelect = async (next: UnidadPeso) => {
    if (isControlDisabled || next === unidad || !hardwareId) return;

    const confirmed = await confirm({
      title: 'Cambiar unidad de la balanza',
      description: `¿Cambiar la unidad de la balanza a ${UNIDAD_LABEL[next]}? El peso mostrado se recalculará.`,
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
    });

    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      await dispositivosApi.updateUnidad(hardwareId, next);
    } catch {
      await alertWarning({
        title: 'No se pudo cambiar la unidad',
        description: 'No se pudo actualizar la unidad de la balanza. Intente nuevamente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">Unidad de la balanza</span>
      <div className="inline-flex rounded-xl border border-border overflow-hidden">
        {OPTIONS.map((option) => {
          const isActive = option === unidad;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={isActive}
              disabled={isControlDisabled}
              onClick={() => handleSelect(option)}
              className={`min-w-[60px] min-h-[44px] px-4 py-2 text-base font-bold uppercase transition-colors
                ${isActive ? activeClass : 'bg-muted text-muted-foreground'}
                ${isControlDisabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
            >
              {UNIDAD_LABEL[option]}
            </button>
          );
        })}
      </div>
    </div>
  );
};
