import * as THREE from 'three';
import { TRAY_TOP } from './balanzaModel';

export const LETTER_SCALE = 0.9;
export const DROP_HEIGHT = 3.0;
export const DROP_DELAY = 0.35;
const GRAVITY = 14;
/** Fraction of the fall speed that becomes compression on impact. */
const IMPACT_KEEP = 0.3;
const STIFFNESS = 70;
const DAMPING = 6;
const SWAY_START = 2.2;
const BASE_YAW = -0.35;
const MAX_PRESS = 0.6;

export interface SimState {
  t: number;
  /** Letter height above the tray; negative = pressing the scale down. */
  s: number;
  v: number;
  sway: number;
  landedAt: number | null;
}

export function createSim(animate: boolean): SimState {
  return { t: 0, s: animate ? DROP_HEIGHT : 0, v: 0, sway: 0, landedAt: null };
}

/**
 * Advance the drop: free fall, a bounce on the tray (the scale gives like a
 * spring while pressed), then rest. Returns true on the step of first impact.
 */
export function stepSim(st: SimState, dt: number): boolean {
  st.t += dt;
  let landed = false;

  if (st.t > DROP_DELAY) {
    const wasAbove = st.s > 0;
    const accel = st.s > 0 ? -GRAVITY : -STIFFNESS * st.s - DAMPING * st.v;
    st.v += accel * dt;
    st.s += st.v * dt;

    if (wasAbove && st.s <= 0) {
      st.v *= IMPACT_KEEP;
      if (st.landedAt === null) {
        st.landedAt = st.t;
        landed = true;
      }
    }
    if (st.s <= 0 && Math.abs(st.s) < 0.002 && Math.abs(st.v) < 0.05) {
      st.s = 0;
      st.v = 0;
    }
  }

  st.sway = THREE.MathUtils.damp(st.sway, st.t > SWAY_START ? 1 : 0, 1.5, dt);
  return landed;
}

export interface PoseTargets {
  root: THREE.Group | null;
  rig: THREE.Group | null;
  letter: THREE.Group | null;
  lcdMaterial: THREE.MeshStandardMaterial;
}

/** Write the simulation state onto the scene objects. */
export function applyPose(targets: PoseTargets, st: SimState, animate: boolean): void {
  const { root, rig, letter, lcdMaterial } = targets;
  const press = Math.max(-MAX_PRESS, Math.min(0, st.s));

  if (rig) rig.position.y = 0.1 * press;
  if (letter) {
    letter.position.y = TRAY_TOP + Math.max(st.s, 0);
    letter.scale.set(
      LETTER_SCALE * (1 - 0.15 * press),
      LETTER_SCALE * (1 + 0.25 * press),
      LETTER_SCALE,
    );
  }
  if (root) root.rotation.y = BASE_YAW + Math.sin(st.t * 0.7) * 0.28 * st.sway;

  const on = !animate
    ? 1
    : st.landedAt === null
      ? 0
      : THREE.MathUtils.clamp((st.t - st.landedAt) / 0.4, 0, 1);
  lcdMaterial.emissiveIntensity = 0.2 + 0.5 * on;
}
