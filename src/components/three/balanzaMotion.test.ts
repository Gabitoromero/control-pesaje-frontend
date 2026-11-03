import { describe, it, expect } from 'vitest';
import { createSim, stepSim, DROP_DELAY, DROP_HEIGHT } from './balanzaMotion';

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
