import React from 'react';
import { getToleranceLayout } from '../utils/toleranceRange';
import { isWithinTolerance } from '../utils/toleranceStatus';

export interface ToleranceDisplayProps {
  pesoNeto: number;
  pesoMinimo: number;
  pesoIdeal: number;
  pesoMaximo: number;
  /** Accent color: 'primary' (cyan, default) for TabletWorkspace, 'warning' (amber) for Muestras Libres. */
  variant?: 'primary' | 'warning';
}

/**
 * Renders the tolerance visualization block shared between TabletWorkspace and
 * the Muestras Libres flow: an OK / Fuera-de-Rango badge (only shown once a
 * weight reading is present), a tolerance bar with a fill range + ideal
 * marker, and a MINIMO / IDEAL / MAXIMO 3-card row.
 *
 * Computes `getToleranceLayout` and `isWithinTolerance` internally so callers
 * only need to pass the raw tolerance bounds and the live reading.
 */
export const ToleranceDisplay: React.FC<ToleranceDisplayProps> = ({
  pesoNeto,
  pesoMinimo,
  pesoIdeal,
  pesoMaximo,
  variant = 'primary',
}) => {
  const toleranceLayout = getToleranceLayout(pesoMinimo, pesoIdeal, pesoMaximo);
  const isInRange = isWithinTolerance(pesoNeto, pesoMinimo, pesoMaximo);

  const fillClass = variant === 'warning' ? 'bg-warning/20' : 'bg-primary/20';
  const markerClass = variant === 'warning' ? 'bg-warning' : 'bg-primary';

  return (
    <>
      {pesoNeto > 0 && (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            isInRange ? 'bg-success-muted text-success' : 'bg-danger-muted text-danger'
          }`}
        >
          {isInRange ? 'OK' : 'Fuera de Rango'}
        </span>
      )}

      <div className="w-full">
        <div className="relative w-full h-2 rounded-full bg-muted mb-3">
          <div
            className={`absolute h-full rounded-full ${fillClass}`}
            style={{ left: `${toleranceLayout.left}%`, width: `${toleranceLayout.width}%` }}
          />
          <div
            className={`absolute top-[-2px] w-[2px] h-3 ${markerClass}`}
            style={{ left: `${toleranceLayout.idealLeft}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-card border border-border rounded-lg p-2 text-center">
            <div className="text-xs text-muted-foreground">MINIMO</div>
            <div className="text-sm font-bold text-foreground tabular-nums">{pesoMinimo.toFixed(3)} kg</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-2 text-center">
            <div className="text-xs text-muted-foreground">IDEAL</div>
            <div className="text-sm font-bold text-foreground tabular-nums">{pesoIdeal.toFixed(3)} kg</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-2 text-center">
            <div className="text-xs text-muted-foreground">MAXIMO</div>
            <div className="text-sm font-bold text-foreground tabular-nums">{pesoMaximo.toFixed(3)} kg</div>
          </div>
        </div>
      </div>
    </>
  );
};
