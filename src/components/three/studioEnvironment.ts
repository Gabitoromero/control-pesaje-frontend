import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/**
 * Give the scene procedural studio reflections (no network fetch), so the
 * stainless parts look like metal. Returns a cleanup function.
 */
export function installStudioEnvironment(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  intensity = 0.35,
): () => void {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const target = pmrem.fromScene(room, 0.04);
  scene.environment = target.texture;
  scene.environmentIntensity = intensity;
  room.dispose();
  pmrem.dispose();

  return () => {
    scene.environment = null;
    target.dispose();
  };
}
