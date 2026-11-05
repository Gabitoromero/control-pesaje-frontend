import type { ComponentType } from 'react';
import { motion, useReducedMotion } from 'motion/react';

export type ReporteIconTipo = 'muestras' | 'pasadas' | 'rutas';

interface DibujoProps {
  /** Play the loop; otherwise show the calm resting pose. */
  animate: boolean;
}

const SVG_PROPS = {
  viewBox: '0 0 48 48',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  className: 'w-9 h-9',
} as const;

const REST = { duration: 0.35, ease: 'easeOut' } as const;

// ── Muestras: a scale that tips and settles, like a weighing ─────────────────

const SWING = [0, -9, 7, -4, 2, 0];
const SWING_LOOP = { duration: 1.8, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.4 } as const;

function BalanzaIcono({ animate }: DibujoProps) {
  const beam = { rotate: animate ? SWING : 0 };
  // The pans counter-rotate around their hooks so they keep hanging straight.
  const pan = { rotate: animate ? SWING.map((grados) => -grados) : 0 };
  const transition = animate ? SWING_LOOP : REST;

  return (
    <svg data-icono="balanza" {...SVG_PROPS}>
      <path d="M16 41h16M24 41V12" />
      <motion.g initial={false} animate={beam} transition={transition} style={{ transformOrigin: '24px 12px' }}>
        <path d="M9 12h30" />
        <motion.g initial={false} animate={pan} transition={transition} style={{ transformOrigin: '9px 12px' }}>
          <path d="M9 12L4.5 25M9 12L13.5 25M4 25h10c0 3-2.2 5-5 5s-5-2-5-5z" />
        </motion.g>
        <motion.g initial={false} animate={pan} transition={transition} style={{ transformOrigin: '39px 12px' }}>
          <path d="M39 12L34.5 25M39 12L43.5 25M34 25h10c0 3-2.2 5-5 5s-5-2-5-5z" />
        </motion.g>
      </motion.g>
      <circle cx="24" cy="12" r="2.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

// ── Pasadas: a full lap of the track, finished with a check ──────────────────

const PISTA = 'M16 34H32A10 10 0 0 0 32 14H16A10 10 0 0 0 16 34Z';
const VUELTA = 1.8;
const VUELTA_LOOP = { duration: VUELTA, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.9 } as const;

function PasadasIcono({ animate }: DibujoProps) {
  return (
    <svg data-icono="carrera" {...SVG_PROPS}>
      <path d={PISTA} opacity={0.3} />
      <motion.path
        d={PISTA}
        initial={false}
        animate={{ pathLength: animate ? [0, 1] : 1 }}
        transition={animate ? VUELTA_LOOP : REST}
      />
      <motion.path
        d="M19.5 24.5l3.2 3.2 6.8-6.8"
        initial={false}
        animate={animate ? { pathLength: [0, 0, 1], opacity: [0, 0, 1] } : { pathLength: 1, opacity: 1 }}
        transition={animate ? { ...VUELTA_LOOP, times: [0, 0.8, 1] } : REST}
      />
      <motion.circle
        cx="0"
        cy="0"
        r="3"
        fill="currentColor"
        stroke="none"
        initial={false}
        style={{ offsetPath: `path("${PISTA}")`, offsetRotate: '0deg' }}
        animate={animate ? { offsetDistance: ['0%', '100%'], opacity: [1, 1, 0], } : { opacity: 0 }}
        transition={animate ? { ...VUELTA_LOOP, times: [0, 0.99, 1] } : REST}
      />
    </svg>
  );
}

// ── Rutas: dotted road whose dots flow towards the destination ───────────────

const CAMINO = 'M9 37C9 29 22 32 22 26C22 20 38 27 38 21';
const PUNTOS_PERIODO = 6.01;
const CAMINO_LOOP = { duration: 0.9, ease: 'linear', repeat: Infinity } as const;

function RutasIcono({ animate }: DibujoProps) {
  return (
    <svg data-icono="camino" {...SVG_PROPS}>
      <circle cx="9" cy="40" r="3" />
      <motion.path
        d={CAMINO}
        strokeWidth={3}
        strokeDasharray={`0.01 ${PUNTOS_PERIODO - 0.01}`}
        initial={false}
        animate={{ strokeDashoffset: animate ? [0, -PUNTOS_PERIODO] : 0 }}
        transition={animate ? CAMINO_LOOP : { duration: 0 }}
      />
      <motion.g
        initial={false}
        animate={{ y: animate ? [0, -2.5, 0] : 0 }}
        transition={animate ? { duration: 0.9, ease: 'easeInOut', repeat: Infinity } : REST}
      >
        <path d="M38 3a7 7 0 0 1 7 7c0 5-7 11-7 11s-7-6-7-11a7 7 0 0 1 7-7z" />
        <circle cx="38" cy="10" r="2.2" fill="currentColor" stroke="none" />
      </motion.g>
    </svg>
  );
}

const DIBUJOS: Record<ReporteIconTipo, ComponentType<DibujoProps>> = {
  muestras: BalanzaIcono,
  pasadas: PasadasIcono,
  rutas: RutasIcono,
};

interface ReporteIconProps {
  tipo: ReporteIconTipo;
  /** The card is hovered or focused: the icon plays its animation. */
  active: boolean;
}

/** Decorative tile with an animated SVG that tells the report types apart at a glance. */
export function ReporteIcon({ tipo, active }: ReporteIconProps) {
  const reducedMotion = useReducedMotion();
  const Dibujo = DIBUJOS[tipo];

  return (
    <div
      data-testid={`reporte-icon-${tipo}`}
      data-active={active}
      aria-hidden="true"
      className="shrink-0 w-14 h-14 rounded-2xl bg-brand-muted text-brand flex items-center justify-center"
    >
      <Dibujo animate={active && !reducedMotion} />
    </div>
  );
}
