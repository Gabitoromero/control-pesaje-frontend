import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
  applyPose,
  beginSpin,
  createSim,
  createSpin,
  dragSpin,
  endSpin,
  stepSim,
  stepSpin,
  DROP_DELAY,
  DROP_HEIGHT,
} from './balanzaMotion';
import { BASE_YAW } from './balanzaModel';

function run(seconds: number, dt = 1 / 60) {
  const sim = createSim(true);
  const landings: number[] = [];
  let minS = 0;
  for (let t = 0; t < seconds; t += dt) {
    if (stepSim(sim, dt)) landings.push(sim.t);
    minS = Math.min(minS, sim.s);
  }
  return { sim, landings, minS };
}

describe('letter drop simulation', () => {
  it('starts at rest when animation is disabled', () => {
    const sim = createSim(false);
    expect(sim.s).toBe(0);
    expect(sim.landedAt).toBeNull();
  });

  it('holds still during the delay, then falls', () => {
    const sim = createSim(true);
    expect(sim.s).toBe(DROP_HEIGHT);
    stepSim(sim, DROP_DELAY / 2);
    expect(sim.s).toBe(DROP_HEIGHT);
    for (let i = 0; i < 20; i++) stepSim(sim, 1 / 60);
    expect(sim.s).toBeLessThan(DROP_HEIGHT);
  });

  it('reports the first landing once and then comes to rest on the tray', () => {
    const { sim, landings, minS } = run(10);
    expect(landings).toHaveLength(1);
    expect(landings[0]).toBeGreaterThan(DROP_DELAY);
    expect(sim.landedAt).toBe(landings[0]);
    expect(sim.s).toBe(0);
    expect(sim.v).toBe(0);
    expect(minS).toBeGreaterThan(-0.6);
  });
});

describe('touch spin', () => {
  it('rotates proportionally to the horizontal drag, in both directions', () => {
    const spin = createSpin();
    beginSpin(spin);
    dragSpin(spin, 100, 0.1);
    expect(spin.yaw).toBeGreaterThan(0.5);
    dragSpin(spin, -100, 0.1);
    expect(spin.yaw).toBeCloseTo(0, 6);
  });

  it('does not coast while the finger is down', () => {
    const spin = createSpin();
    beginSpin(spin);
    dragSpin(spin, 10, 0.016);
    const held = spin.yaw;
    stepSpin(spin, 0.1);
    expect(spin.yaw).toBe(held);
  });

  it('keeps turning with inertia after release, then comes to rest', () => {
    const spin = createSpin();
    beginSpin(spin);
    dragSpin(spin, 40, 0.016);
    endSpin(spin);
    const released = spin.yaw;

    stepSpin(spin, 0.016);
    expect(spin.yaw).toBeGreaterThan(released);

    for (let i = 0; i < 600; i++) stepSpin(spin, 1 / 60);
    expect(spin.velocity).toBe(0);
    const rest = spin.yaw;
    stepSpin(spin, 1 / 60);
    expect(spin.yaw).toBe(rest);
  });

  it('flags the first touch so the idle sway can hand over smoothly', () => {
    const spin = createSpin();
    expect(spin.touched).toBe(false);
    beginSpin(spin);
    expect(spin.touched).toBe(true);
  });

  it('keeps the visible angle continuous when the sway hands over to the user', () => {
    const root = new THREE.Group();
    const targets = { root, rig: null, letter: null, lcdMaterial: new THREE.MeshStandardMaterial() };
    const sim = createSim(false);
    const spin = createSpin();
    sim.sway = 1;
    sim.t = 2;

    applyPose(targets, sim, spin, false);
    const before = root.rotation.y;
    expect(before).not.toBeCloseTo(BASE_YAW, 3);

    beginSpin(spin);
    applyPose(targets, sim, spin, false);
    expect(root.rotation.y).toBeCloseTo(before, 6);

    sim.t = 3;
    applyPose(targets, sim, spin, false);
    expect(root.rotation.y).toBeCloseTo(before, 6);
  });
});

