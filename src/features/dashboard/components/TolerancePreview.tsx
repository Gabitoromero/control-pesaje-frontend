import { motion } from 'motion/react';
import { formatTolerancePct } from '../../tablet/utils/tolerance';
import { getTolerancePreviewLayout } from '../utils/tolerancePreview';

interface TolerancePreviewProps {
  /** Tolerance percentage currently entered (may be unsaved). */
  toleranciaPct: number;
}

/**
 * Mini animation (schematic, not real weights): a horizontal line with a green
 * band and red zones, and two markers that move away from the band edges in
 * proportion to the given tolerance.
 */
export function TolerancePreview({ toleranciaPct }: TolerancePreviewProps) {
  const layout = getTolerancePreviewLayout(toleranciaPct);
  const bandRight = layout.bandLeft + layout.bandWidth;

  return (
    <div className="space-y-3">
      <div className="relative h-10">
        <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full overflow-hidden">
          <div
            data-testid="preview-blocked-lower"
            className="absolute inset-y-0 bg-red-500"
            style={{ left: 0, width: `${layout.bandLeft}%` }}
          />
          <div
            data-testid="preview-ok-band"
            className="absolute inset-y-0 bg-green-500"
            style={{ left: `${layout.bandLeft}%`, width: `${layout.bandWidth}%` }}
          />
          <div
            data-testid="preview-blocked-upper"
            className="absolute inset-y-0 bg-red-500"
            style={{ left: `${bandRight}%`, right: 0 }}
          />
        </div>

        <div
          data-testid="preview-ideal-marker"
          className="absolute top-0 bottom-0 w-0.5 bg-foreground"
          style={{ left: `${layout.idealLeft}%` }}
        />

        <motion.div
          data-testid="preview-block-lower"
          className="absolute top-1/2 h-6 w-1 -translate-x-1/2 -translate-y-1/2 rounded bg-foreground/70"
          initial={false}
          animate={{ left: `${layout.lowerBlockLeft}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        />
        <motion.div
          data-testid="preview-block-upper"
          className="absolute top-1/2 h-6 w-1 -translate-x-1/2 -translate-y-1/2 rounded bg-foreground/70"
          initial={false}
          animate={{ left: `${layout.upperBlockLeft}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        />
      </div>

      <p className="text-sm text-muted-foreground">
        {`Se bloquea por debajo del ${formatTolerancePct(100 - toleranciaPct)}% del mínimo y por encima del ${formatTolerancePct(100 + toleranciaPct)}% del máximo`}
      </p>
    </div>
  );
}
