import type { CSSProperties } from 'react';
import { BLUEPRINT_FILLS, BLUEPRINT_LINES, BLUEPRINT_SIZE } from './balanzaBlueprint';
import './balanzaBlueprint.css';

/** Seconds after the intro starts at which each part begins to draw. */
const LINE_DELAY: Record<string, number> = {
  housing: 0,
  panel: 0.3,
  tray: 0.6,
  pole: 0.9,
  head: 1.1,
  keys: 1.4,
};

interface Props {
  /** Play the draw-and-fill choreography; otherwise show the finished drawing. */
  animate: boolean;
  /** Fade out: the 3D scene has taken over. */
  revealed: boolean;
  dark: boolean;
}

/**
 * Line drawing of the scale, projected from the 3D model with the same
 * camera, so it morphs into the 3D scene without a jump. Pure SVG + CSS.
 */
export default function BalanzaBlueprint({ animate, revealed, dark }: Props) {
  const classes = [
    'bp absolute inset-0 h-full w-full overflow-visible',
    animate ? 'bp-animate' : '',
    revealed ? 'bp-revealed' : '',
    dark ? 'text-slate-100' : 'text-slate-600',
  ].join(' ');

  return (
    <svg
      data-testid="balanza-blueprint"
      className={classes}
      viewBox={`0 0 ${BLUEPRINT_SIZE} ${BLUEPRINT_SIZE}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <g>
        {BLUEPRINT_FILLS.map((shape, i) => (
          <path key={i} d={shape.d} fill={shape.fill} className="bp-fill" />
        ))}
      </g>
      <g className="bp-lines">
        {BLUEPRINT_LINES.map((line) => (
          <path
            key={line.part}
            d={line.d}
            pathLength={1}
            className="bp-line"
            style={{ '--bp-delay': `${LINE_DELAY[line.part] ?? 0}s` } as CSSProperties}
          />
        ))}
      </g>
    </svg>
  );
}
