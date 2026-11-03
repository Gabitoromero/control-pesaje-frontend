import * as THREE from 'three';

/**
 * Geometry and layout of the price-computing platform scale shown on the
 * login: light-grey housing with a sloped blue control panel, stainless
 * tray with bent-up side flanges, and a pole carrying a customer display.
 * World units; ground at y = 0, front of the scale faces +z.
 */

const BEVEL = 0.05;
export const HOUSING_WIDTH = 3.3;

// Side profile of the housing (shape x = world z, shape y = world y).
const PROFILE_BACK = -1.05;
const PROFILE_FRONT = 1.2;
const PROFILE_FRONT_TOP = 0.2;
const PROFILE_PANEL_TOP_Z = 0.5;
const PROFILE_TOP = 0.48;

export const HOUSING_TOP = PROFILE_TOP + 2 * BEVEL;

/** Slope of the control panel and its placement on the housing surface. */
const SLOPE = Math.atan2(PROFILE_TOP - PROFILE_FRONT_TOP, PROFILE_FRONT - PROFILE_PANEL_TOP_Z);
const PANEL_OFFSET = BEVEL + 0.003;
export const PANEL = {
  z:
    (PROFILE_FRONT + PROFILE_PANEL_TOP_Z) / 2 + Math.sin(SLOPE) * PANEL_OFFSET,
  y:
    (PROFILE_FRONT_TOP + PROFILE_TOP) / 2 + BEVEL + Math.cos(SLOPE) * PANEL_OFFSET,
  rotationX: -(Math.PI / 2 - SLOPE),
  width: 2.9,
  height: 0.72,
} as const;

export const TRAY_Y = HOUSING_TOP + 0.04;
export const TRAY_THICKNESS = 0.035;
export const TRAY_TOP = TRAY_Y + TRAY_THICKNESS;
export const TRAY_Z = -0.1;
export const TRAY_DEPTH = 1.55;
export const TRAY_FLAT_WIDTH = 2.76;

export const POLE = { x: 1.0, z: -0.98, height: 2.0, radius: 0.045 } as const;
export const HEAD_Y = HOUSING_TOP + POLE.height + 0.3;

export function createHousingGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(PROFILE_BACK, 0);
  shape.lineTo(PROFILE_FRONT, 0);
  shape.lineTo(PROFILE_FRONT, PROFILE_FRONT_TOP);
  shape.lineTo(PROFILE_PANEL_TOP_Z, PROFILE_TOP);
  shape.lineTo(PROFILE_BACK, PROFILE_TOP);
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: HOUSING_WIDTH,
    bevelEnabled: true,
    bevelSize: BEVEL,
    bevelThickness: BEVEL,
    bevelSegments: 3,
    curveSegments: 1,
  });
  // Shape x -> world z, extrusion -> world x; rest the bottom on y = 0.
  geometry.rotateY(-Math.PI / 2);
  geometry.translate(HOUSING_WIDTH / 2, BEVEL, 0);
  return geometry;
}

/** Stainless tray: flat pan with side flanges bent up and outward. */
export function createTrayGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const half = TRAY_FLAT_WIDTH / 2;
  const flange = 0.4;
  const rise = 0.34;
  const t = TRAY_THICKNESS;
  shape.moveTo(-half - flange, rise);
  shape.lineTo(-half, 0);
  shape.lineTo(half, 0);
  shape.lineTo(half + flange, rise);
  shape.lineTo(half + flange, rise + t);
  shape.lineTo(half - 0.01, t);
  shape.lineTo(-half + 0.01, t);
  shape.lineTo(-half - flange, rise + t);
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, { depth: TRAY_DEPTH, bevelEnabled: false });
  geometry.translate(0, 0, -TRAY_DEPTH / 2);
  return geometry;
}

export interface Key {
  x: number;
  y: number;
  color: string;
}

const KEY_LIGHT = '#e6e9ee';
const KEY_BLUE = '#3f78c9';
const KEY_RED = '#d13434';

/** Keypad laid out in panel-local coordinates (x right, y up the slope). */
export const KEYPAD: ReadonlyArray<Key> = (() => {
  const keys: Key[] = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const blue = col === 3 && row < 2;
      const red = col === 3 && row === 3;
      keys.push({
        x: 0.28 + col * 0.22,
        y: 0.2 - row * 0.12,
        color: red ? KEY_RED : blue ? KEY_BLUE : KEY_LIGHT,
      });
    }
  }
  for (let row = 0; row < 3; row++) {
    keys.push({ x: 1.16, y: 0.2 - row * 0.15, color: KEY_LIGHT });
  }
  return keys;
})();

export const LCD_IDLE = { weight: '0.000', price: '4.800', total: '0.00' } as const;
export const LCD_WEIGHED = { weight: '1.250', price: '4.800', total: '6.00' } as const;

export type LcdReading = { weight: string; price: string; total: string };

/** Paint a three-row LCD (weight, unit price, total) onto a 2D canvas. */
export function drawLcd(ctx: CanvasRenderingContext2D, reading: LcdReading): void {
  const { width, height } = ctx.canvas;
  ctx.fillStyle = '#cfe0e6';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#16262d';
  ctx.textBaseline = 'middle';

  const rows: Array<[string, string]> = [
    [reading.weight, 'kg'],
    [reading.price, '$/kg'],
    [reading.total, '$'],
  ];
  rows.forEach(([value, unit], i) => {
    const y = height * (0.2 + i * 0.3);
    ctx.textAlign = 'right';
    ctx.font = 'bold 58px ui-monospace, Menlo, Consolas, monospace';
    ctx.fillText(value, width * 0.74, y);
    ctx.textAlign = 'left';
    ctx.font = 'bold 24px ui-monospace, Menlo, Consolas, monospace';
    ctx.fillText(unit, width * 0.78, y);
  });
}

/** Repaint the LCD with a new reading and flag its texture for upload. */
export function paintLcd(
  ctx: CanvasRenderingContext2D,
  texture: THREE.Texture,
  reading: LcdReading,
): void {
  drawLcd(ctx, reading);
  texture.needsUpdate = true;
}
