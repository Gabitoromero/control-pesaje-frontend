import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useReducedMotion } from 'motion/react';
import * as THREE from 'three';
import {
  HEAD_Y,
  HOUSING_TOP,
  KEYPAD,
  LCD_IDLE,
  LCD_WEIGHED,
  PANEL,
  POLE,
  TRAY_DEPTH,
  TRAY_FLAT_WIDTH,
  TRAY_Y,
  TRAY_Z,
  createHousingGeometry,
  createTrayGeometry,
  drawLcd,
  paintLcd,
} from './balanzaModel';
import { applyPose, createSim, stepSim } from './balanzaMotion';
import { installStudioEnvironment } from './studioEnvironment';
import { createMGeometry } from './mShape';

const NAVY = '#002a54';
const PANEL_BLUE = '#1d4f9e';

function Steel() {
  return <meshStandardMaterial color="#d3d7dc" roughness={0.28} metalness={0.85} />;
}

function Scene({ animate }: { animate: boolean }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const invalidate = useThree((s) => s.invalidate);

  const letterGeometry = useMemo(() => createMGeometry(), []);
  const housingGeometry = useMemo(() => createHousingGeometry(), []);
  const trayGeometry = useMemo(() => createTrayGeometry(), []);
  useEffect(
    () => () => {
      letterGeometry.dispose();
      housingGeometry.dispose();
      trayGeometry.dispose();
    },
    [letterGeometry, housingGeometry, trayGeometry],
  );

  // One LCD texture/material shared by the panel and the pole display.
  const lcd = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (ctx) drawLcd(ctx, animate ? LCD_IDLE : LCD_WEIGHED);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      emissiveMap: texture,
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: 0.3,
      roughness: 0.3,
    });
    return { ctx, texture, material };
  }, [animate]);
  useEffect(
    () => () => {
      lcd.texture.dispose();
      lcd.material.dispose();
    },
    [lcd],
  );

  useEffect(() => {
    const dispose = installStudioEnvironment(gl, scene);
    invalidate();
    return dispose;
  }, [gl, scene, invalidate]);

  const root = useRef<THREE.Group>(null);
  const rig = useRef<THREE.Group>(null);
  const letter = useRef<THREE.Group>(null);
  const sim = useRef(createSim(animate));

  useLayoutEffect(() => {
    applyPose(
      {
        root: root.current,
        rig: rig.current,
        letter: letter.current,
        lcdMaterial: lcd.material,
      },
      sim.current,
      animate,
    );
  });

  useFrame((_, delta) => {
    if (!animate) return;
    const dt = Math.min(delta, 1 / 30);
    const st = sim.current;

    if (stepSim(st, dt) && lcd.ctx) paintLcd(lcd.ctx, lcd.texture, LCD_WEIGHED);

    applyPose(
      {
        root: root.current,
        rig: rig.current,
        letter: letter.current,
        lcdMaterial: lcd.material,
      },
      st,
      animate,
    );
  });

  return (
    <>
      <ambientLight intensity={0.15} />
      <directionalLight position={[3, 6, 5]} intensity={1.0} />
      <directionalLight position={[-5, 3, -3]} intensity={0.25} />

      <group ref={root}>
        <group ref={rig}>
          {/* Housing */}
          <mesh geometry={housingGeometry}>
            <meshStandardMaterial color="#d9dcdf" roughness={0.55} metalness={0.05} />
          </mesh>

          {/* Sloped control panel: blue overlay, LCD and keypad */}
          <group position={[0, PANEL.y, PANEL.z]} rotation={[PANEL.rotationX, 0, 0]}>
            <mesh>
              <planeGeometry args={[PANEL.width, PANEL.height]} />
              <meshStandardMaterial color={PANEL_BLUE} roughness={0.5} />
            </mesh>
            <mesh position={[-0.8, 0.02, 0.004]} material={lcd.material}>
              <planeGeometry args={[1.15, 0.5]} />
            </mesh>
            {KEYPAD.map((key, i) => (
              <mesh key={i} position={[key.x, key.y, 0.018]}>
                <boxGeometry args={[0.17, 0.085, 0.035]} />
                <meshStandardMaterial color={key.color} roughness={0.5} />
              </mesh>
            ))}
          </group>

          {/* Tray mounting block, tray and back lip */}
          <mesh position={[0, HOUSING_TOP + 0.02, TRAY_Z]}>
            <boxGeometry args={[2.5, 0.04, TRAY_DEPTH - 0.1]} />
            <meshStandardMaterial color="#2a2f36" roughness={0.8} />
          </mesh>
          <mesh geometry={trayGeometry} position={[0, TRAY_Y, TRAY_Z]}>
            <Steel />
          </mesh>
          <mesh position={[0, TRAY_Y + 0.05, TRAY_Z - TRAY_DEPTH / 2 + 0.015]}>
            <boxGeometry args={[TRAY_FLAT_WIDTH, 0.1, 0.03]} />
            <Steel />
          </mesh>

          {/* Pole and customer display */}
          <mesh position={[POLE.x, HOUSING_TOP + POLE.height / 2, POLE.z]}>
            <cylinderGeometry args={[POLE.radius, POLE.radius, POLE.height, 16]} />
            <Steel />
          </mesh>
          <group position={[POLE.x, HEAD_Y, POLE.z]} rotation={[-0.1, -0.15, 0]}>
            <mesh>
              <boxGeometry args={[1.7, 0.66, 0.17]} />
              <meshStandardMaterial color={PANEL_BLUE} roughness={0.5} />
            </mesh>
            <mesh position={[0, 0, 0.0865]} material={lcd.material}>
              <planeGeometry args={[1.5, 0.5]} />
            </mesh>
          </group>

          {/* Brand letter */}
          <group ref={letter} position={[0, 0, TRAY_Z]}>
            <mesh geometry={letterGeometry}>
              <meshStandardMaterial color={NAVY} roughness={0.5} metalness={0} />
            </mesh>
          </group>
        </group>
      </group>
    </>
  );
}

const BalanzaScene = ({ dark = true }: { dark?: boolean }) => {
  const reducedMotion = useReducedMotion();
  const animate = !reducedMotion;

  return (
    <div className="relative w-full h-72 lg:h-80" aria-hidden="true">
      {/* Soft light behind the navy letter so it reads on dark backgrounds */}
      <div
        className={`pointer-events-none absolute inset-x-6 inset-y-2 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.9),rgba(255,255,255,0))] transition-opacity ${
          dark ? 'opacity-10' : 'opacity-0'
        }`}
      />
      <Canvas
        dpr={[1, 1.5]}
        frameloop={animate ? 'always' : 'demand'}
        camera={{ position: [0, 2.4, 7.6], fov: 30 }}
        onCreated={({ camera }) => camera.lookAt(0, 1.45, 0)}
      >
        <Scene animate={animate} />
      </Canvas>
    </div>
  );
};

export default BalanzaScene;
