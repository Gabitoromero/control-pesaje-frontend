/**
 * Generates src/components/three/balanzaBlueprint.ts: a 2D line drawing of
 * the 3D scale, projected with the exact camera and pose of the login scene
 * so the blueprint morphs into the 3D model without a visible jump.
 *
 * Run from frontend/:  node scripts/generate-balanza-blueprint.mts
 */
import { writeFileSync } from 'node:fs';
import * as THREE from 'three';
import {
  BASE_YAW,
  CAMERA,
  HEAD,
  HEAD_Y,
  HOUSING_TOP,
  KEYPAD,
  KEY_SIZE,
  KEY_Z,
  LIP,
  MOUNT,
  PANEL,
  PANEL_LCD,
  POLE,
  TRAY_DEPTH,
  TRAY_FLAT_WIDTH,
  TRAY_Y,
  TRAY_Z,
  createHousingGeometry,
  createTrayGeometry,
} from '../src/components/three/balanzaModel.ts';

const SIZE = 300;
const OUT = new URL('../src/components/three/balanzaBlueprint.ts', import.meta.url);

// ---- Scene mirror (same transforms as BalanzaScene.tsx) -------------------
const solid = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
const root = new THREE.Group();
root.rotation.y = BASE_YAW;

interface Part {
  name: string;
  mesh: THREE.Mesh;
  /** Draw its visible edges. */
  edges: boolean;
  fill?: string;
}
const parts: Part[] = [];

function add(name: string, geometry: THREE.BufferGeometry, parent: THREE.Object3D, setup: (m: THREE.Mesh) => void, opts: { edges?: boolean; fill?: string } = {}) {
  const mesh = new THREE.Mesh(geometry, solid);
  setup(mesh);
  parent.add(mesh);
  parts.push({ name, mesh, edges: opts.edges ?? true, fill: opts.fill });
  return mesh;
}

const FILL = {
  housing: '#d9dcdf',
  panel: '#1d4f9e',
  lcd: '#cfe0e6',
  tray: '#c3c8ce',
  steel: '#c9ced4',
  head: '#1d4f9e',
};

add('housing', createHousingGeometry(), root, () => {}, { fill: FILL.housing });

const panelGroup = new THREE.Group();
panelGroup.position.set(0, PANEL.y, PANEL.z);
panelGroup.rotation.x = PANEL.rotationX;
root.add(panelGroup);
add('panel', new THREE.PlaneGeometry(PANEL.width, PANEL.height), panelGroup, () => {}, { fill: FILL.panel });
add('panel', new THREE.PlaneGeometry(PANEL_LCD.width, PANEL_LCD.height), panelGroup, (m) => m.position.set(PANEL_LCD.x, PANEL_LCD.y, PANEL_LCD.z), { fill: FILL.lcd });
KEYPAD.forEach((key) => {
  add('keys', new THREE.BoxGeometry(...KEY_SIZE), panelGroup, (m) => m.position.set(key.x, key.y, KEY_Z), { fill: key.color });
});

add('housing', new THREE.BoxGeometry(MOUNT.width, MOUNT.height, TRAY_DEPTH - 0.1), root, (m) => m.position.set(0, HOUSING_TOP + MOUNT.height / 2, TRAY_Z), { edges: false });
add('tray', createTrayGeometry(), root, (m) => m.position.set(0, TRAY_Y, TRAY_Z), { fill: FILL.tray });
add('tray', new THREE.BoxGeometry(TRAY_FLAT_WIDTH, LIP.height, LIP.thickness), root, (m) => m.position.set(0, TRAY_Y + LIP.height / 2, TRAY_Z - TRAY_DEPTH / 2 + LIP.thickness / 2), { fill: FILL.tray });

const pole = add('pole', new THREE.CylinderGeometry(POLE.radius, POLE.radius, POLE.height, 16), root, (m) => m.position.set(POLE.x, HOUSING_TOP + POLE.height / 2, POLE.z), { edges: false, fill: FILL.steel });

const headGroup = new THREE.Group();
headGroup.position.set(POLE.x, HEAD_Y, POLE.z);
headGroup.rotation.set(...HEAD.rotation);
root.add(headGroup);
add('head', new THREE.BoxGeometry(...HEAD.size), headGroup, () => {}, { fill: FILL.head });
add('head', new THREE.PlaneGeometry(HEAD.lcd.width, HEAD.lcd.height), headGroup, (m) => m.position.set(0, 0, HEAD.lcd.z), { fill: FILL.lcd });

root.updateMatrixWorld(true);

// ---- Camera ---------------------------------------------------------------
const camera = new THREE.PerspectiveCamera(CAMERA.fov, 1, 0.1, 100);
camera.position.set(...CAMERA.position);
camera.lookAt(...CAMERA.target);
camera.updateProjectionMatrix();
camera.updateMatrixWorld(true);

const round = (n: number) => Math.round(n * 10) / 10;
function toScreen(world: THREE.Vector3): [number, number] {
  const ndc = world.clone().project(camera);
  return [round(SIZE / 2 + (ndc.x * SIZE) / 2), round(SIZE / 2 - (ndc.y * SIZE) / 2)];
}

// ---- Hidden-line removal --------------------------------------------------
const raycaster = new THREE.Raycaster();
const occluders = parts.map((p) => p.mesh);
function isVisible(point: THREE.Vector3): boolean {
  const dir = point.clone().sub(camera.position);
  const distance = dir.length();
  raycaster.set(camera.position, dir.normalize());
  const hit = raycaster.intersectObjects(occluders, false)[0];
  return !hit || hit.distance >= distance - 0.012;
}

function visibleEdges(part: Part): string[] {
  const edges = new THREE.EdgesGeometry(part.mesh.geometry, 40);
  const pos = edges.getAttribute('position');
  const paths: string[] = [];
  for (let i = 0; i < pos.count; i += 2) {
    const a = new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(part.mesh.matrixWorld);
    const b = new THREE.Vector3().fromBufferAttribute(pos, i + 1).applyMatrix4(part.mesh.matrixWorld);
    const steps = Math.max(2, Math.ceil(a.distanceTo(b) / 0.06));
    let run: Array<[number, number]> = [];
    const flush = () => {
      if (run.length >= 2) paths.push('M' + run.map((p) => p.join(' ')).join('L'));
      run = [];
    };
    for (let s = 0; s <= steps; s++) {
      const p = a.clone().lerp(b, s / steps);
      if (isVisible(p)) run.push(toScreen(p));
      else flush();
    }
    flush();
  }
  return paths;
}

// ---- Fills (convex hull of the projected part) ----------------------------
type Pt = [number, number];
function hull(points: Pt[]): Pt[] {
  const pts = [...points].sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  const cross = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const build = (list: Pt[]) => {
    const out: Pt[] = [];
    for (const p of list) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], p) <= 0) out.pop();
      out.push(p);
    }
    out.pop();
    return out;
  };
  return [...build(pts), ...build([...pts].reverse())];
}

function projectedVertices(part: Part): Pt[] {
  const pos = part.mesh.geometry.getAttribute('position');
  const pts: Pt[] = [];
  for (let i = 0; i < pos.count; i++) {
    pts.push(toScreen(new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(part.mesh.matrixWorld)));
  }
  return pts;
}

// Pole: its silhouette is two vertical lines either side of the axis.
function poleOutline(): { lines: string[]; polygon: Pt[] } {
  const axisBottom = new THREE.Vector3(POLE.x, HOUSING_TOP, POLE.z).applyMatrix4(root.matrixWorld);
  const axisTop = new THREE.Vector3(POLE.x, HOUSING_TOP + POLE.height, POLE.z).applyMatrix4(root.matrixWorld);
  const view = axisBottom.clone().sub(camera.position).setY(0).normalize();
  const side = new THREE.Vector3().crossVectors(view, new THREE.Vector3(0, 1, 0)).normalize().multiplyScalar(POLE.radius);
  const corners = [
    axisBottom.clone().add(side), axisTop.clone().add(side),
    axisTop.clone().sub(side), axisBottom.clone().sub(side),
  ].map(toScreen);
  const lines = [
    `M${corners[0].join(' ')}L${corners[1].join(' ')}`,
    `M${corners[3].join(' ')}L${corners[2].join(' ')}`,
  ];
  return { lines, polygon: corners };
}

// ---- Output ---------------------------------------------------------------
const polygonPath = (poly: Pt[]) => 'M' + poly.map((p) => p.join(' ')).join('L') + 'Z';

const FILL_ORDER = ['pole', 'head', 'housing', 'panel', 'keys', 'tray'];
const fills: Array<{ part: string; d: string; fill: string }> = [];
const poleShape = poleOutline();
fills.push({ part: 'pole', d: polygonPath(poleShape.polygon), fill: FILL.steel });

// Group fills by (part, color) to keep the file small.
const byKey = new Map<string, { part: string; fill: string; ds: string[] }>();
for (const part of parts) {
  if (!part.fill || part === pole) continue;
  const poly = hull(projectedVertices(part));
  const key = `${part.name}|${part.fill}`;
  const entry = byKey.get(key) ?? { part: part.name, fill: part.fill, ds: [] };
  entry.ds.push(polygonPath(poly));
  byKey.set(key, entry);
}
for (const e of byKey.values()) fills.push({ part: e.part, d: e.ds.join(''), fill: e.fill });
fills.sort((a, b) => {
  const rank = (p: string) => FILL_ORDER.indexOf(p);
  // The LCD windows must paint after their frame: keep insertion order within a part.
  return rank(a.part) - rank(b.part);
});

const LINE_ORDER = ['housing', 'panel', 'tray', 'pole', 'head', 'keys'];
const lines: Array<{ part: string; d: string }> = [];
for (const name of LINE_ORDER) {
  const ds: string[] = [];
  if (name === 'pole') ds.push(...poleShape.lines);
  for (const part of parts) if (part.name === name && part.edges) ds.push(...visibleEdges(part));
  if (ds.length) lines.push({ part: name, d: ds.join('') });
}

const file = `// Generated by scripts/generate-balanza-blueprint.mts. Do not edit by hand.
// Projection of the 3D scale with the login camera, hidden lines removed.

export const BLUEPRINT_SIZE = ${SIZE};

export interface BlueprintFill {
  part: string;
  d: string;
  fill: string;
}

export interface BlueprintLine {
  part: string;
  d: string;
}

export const BLUEPRINT_FILLS: ReadonlyArray<BlueprintFill> = ${JSON.stringify(fills, null, 2)};

export const BLUEPRINT_LINES: ReadonlyArray<BlueprintLine> = ${JSON.stringify(lines, null, 2)};
`;
writeFileSync(OUT, file);
console.log(`blueprint: ${fills.length} fills, ${lines.length} line groups, ${(file.length / 1024).toFixed(1)} KB`);
