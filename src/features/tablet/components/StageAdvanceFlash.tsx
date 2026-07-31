import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';
import type { StageAdvanceSignal } from '../hooks/useStageAdvanceSignal';

interface StageAdvanceFlashProps {
  signal: StageAdvanceSignal;
}

/**
 * One-shot, pointer-events-none overlay that flashes a success-tinted sweep
 * plus the incoming stage name whenever the derived active etapa advances
 * forward. Forward-only: a `backward` (delete-driven regression) signal
 * renders nothing, per spec `Scenario: Regression is silent` — the operator
 * must not be misinformed by a celebratory effect on a regression, and a
 * non-blocking absence of any overlay does not itself violate the "no
 * warning/confirmation/blocking prompt" rule.
 */
export const StageAdvanceFlash: React.FC<StageAdvanceFlashProps> = ({ signal }) => {
  return (
    <AnimatePresence>
      {signal.kind === 'forward' && (
        <motion.div
          key={signal.etapaId}
          data-testid="stage-advance-flash"
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden rounded-xl z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-success/0 via-success/25 to-success/0"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
          <motion.div
            className="relative flex items-center gap-2 px-4 py-2 rounded-full bg-success text-white font-bold shadow-lg"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{signal.nombre}</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
