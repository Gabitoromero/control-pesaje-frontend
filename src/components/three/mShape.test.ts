import { describe, it, expect } from 'vitest';
import { createMGeometry } from './mShape';

describe('createMGeometry', () => {
  it('rests on y = 0 and is centered on X and Z', () => {
    const geometry = createMGeometry();
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;

    expect(box.min.y).toBeCloseTo(0, 3);
    expect((box.min.x + box.max.x) / 2).toBeCloseTo(0, 5);
    expect((box.min.z + box.max.z) / 2).toBeCloseTo(0, 5);
  });
});
