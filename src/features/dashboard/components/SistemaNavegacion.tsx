import { motion, MotionConfig, useSpring } from 'motion/react';
import {
  CollapsibleSection,
  type CollapsibleSectionProps,
} from '../../../components/ui/CollapsibleSection';
import './sistema-motion.css';

export interface SeccionIndice {
  id: string;
  etiqueta: string;
}

/** Sticky section index with reading progress. Chips are touch-sized (44px). */
export function SistemaIndice({
  secciones,
  activa,
  progreso,
  onIr,
}: {
  secciones: SeccionIndice[];
  activa: string;
  progreso: ReturnType<typeof useSpring>;
  onIr: (id: string) => void;
}) {
  return (
    <MotionConfig reducedMotion="user">
      <nav
        aria-label="Secciones del manual"
        className="sistema-indice sticky top-0 z-10 -mx-6 px-6 bg-background/90 supports-[backdrop-filter]:bg-background/70 backdrop-blur border-b border-border"
      >
        <motion.div className="sistema-progreso" style={{ scaleX: progreso }} />
        <ul className="flex gap-2 overflow-x-auto py-2 [scrollbar-width:none]">
          {secciones.map((s) => {
            const esActiva = s.id === activa;
            return (
              <li key={s.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => onIr(s.id)}
                  aria-current={esActiva ? 'true' : undefined}
                  className={`relative min-h-[44px] px-4 rounded-full text-sm font-medium transition-colors ${
                    esActiva ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {esActiva && (
                    <motion.span
                      layoutId="sistema-indice-activa"
                      className="absolute inset-0 rounded-full bg-primary"
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    />
                  )}
                  <span className="relative">{s.etiqueta}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </MotionConfig>
  );
}

/** A manual section that fades in with a cascade delay (`orden`) and anchors for the index. */
export function SeccionManual({
  id,
  orden,
  ...props
}: CollapsibleSectionProps & { id: string; orden: number }) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.section
        id={id}
        className="sistema-seccion"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.05 + orden * 0.07 }}
      >
        <CollapsibleSection {...props} />
      </motion.section>
    </MotionConfig>
  );
}
