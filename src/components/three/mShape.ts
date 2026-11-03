import * as THREE from 'three';
import { M_OUTLINE, M_WIDTH } from './mOutline';

const BEVEL_SIZE = 0.012;
const BEVEL_THICKNESS = 0.03;

/**
 * Extruded "M" in the MontHelado wordmark design, with its bottom face at
 * y = 0 and centered on X/Z, so the letter's origin sits on whatever
 * surface it rests on.
 */
export function createMGeometry(depth = 0.3): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  M_OUTLINE.forEach(([x, y], i) => (i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)));
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSize: BEVEL_SIZE,
    bevelThickness: BEVEL_THICKNESS,
    bevelSegments: 3,
    curveSegments: 1,
  });
  geometry.translate(-M_WIDTH / 2, BEVEL_SIZE, -depth / 2);
  return geometry;
}
