import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useReducedMotion } from 'motion/react';
import * as THREE from 'three';
import {
  CAMERA,
  HEAD,
  HEAD_Y,
  HOUSING_TOP,
  KEYPAD,
  KEY_SIZE,
  KEY_Z,
  LIP,
  MOUNT,
  PANEL_LCD,
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
import {
  applyPose,
  beginSpin,
  createSim,
  createSpin,
  dragSpin,
  endSpin,
  stepSim,
  stepSpin,
  type SpinState,
} from './balanzaMotion';
import { installStudioEnvironment } from './studioEnvironment';
import { createMGeometry } from './mShape';

const NAVY = '#002a54';
const PANEL_BLUE = '#1d4f9e';

function Steel() {
  return <meshStandardMaterial color="#d3d7dc" roughness={0.28} metalness={0.85} />;
}

interface SceneProps {
  animate: boolean;
  /** The letter only starts falling once this is true. */
  playing: boolean;
  spin: SpinState;
  onInvalidate: (invalidate: () => void) => void;
}

function Scene({ animate, playing, spin, onInvalidate }: SceneProps) {
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
    onInvalidate(invalidate);
  }, [invalidate, onInvalidate]);

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
      spin,
      animate,
    );
  });

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const st = sim.current;

    if (animate && playing && stepSim(st, dt) && lcd.ctx) {
      paintLcd(lcd.ctx, lcd.texture, LCD_WEIGHED);
    }
    stepSpin(spin, dt);

    applyPose(
      {
        root: root.current,
        rig: rig.current,
        letter: letter.current,
        lcdMaterial: lcd.material,
      },
      st,
      spin,
      animate,
    );

    // Demand mode (reduced motion) only renders on request: keep coasting.
    if (!animate && (spin.dragging || spin.velocity !== 0)) invalidate();
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
            <mesh position={[PANEL_LCD.x, PANEL_LCD.y, PANEL_LCD.z]} material={lcd.material}>
              <planeGeometry args={[PANEL_LCD.width, PANEL_LCD.height]} />
            </mesh>
            {KEYPAD.map((key, i) => (
              <mesh key={i} position={[key.x, key.y, KEY_Z]}>
                <boxGeometry args={[...KEY_SIZE]} />
                <meshStandardMaterial color={key.color} roughness={0.5} />
              </mesh>
            ))}
          </group>

          {/* Tray mounting block, tray and back lip */}
          <mesh position={[0, HOUSING_TOP + MOUNT.height / 2, TRAY_Z]}>
            <boxGeometry args={[MOUNT.width, MOUNT.height, TRAY_DEPTH - 0.1]} />
            <meshStandardMaterial color="#2a2f36" roughness={0.8} />
          </mesh>
          <mesh geometry={trayGeometry} position={[0, TRAY_Y, TRAY_Z]}>
            <Steel />
          </mesh>
          <mesh position={[0, TRAY_Y + LIP.height / 2, TRAY_Z - TRAY_DEPTH / 2 + LIP.thickness / 2]}>
            <boxGeometry args={[TRAY_FLAT_WIDTH, LIP.height, LIP.thickness]} />
            <Steel />
          </mesh>

          {/* Pole and customer display */}
          <mesh position={[POLE.x, HOUSING_TOP + POLE.height / 2, POLE.z]}>
            <cylinderGeometry args={[POLE.radius, POLE.radius, POLE.height, 16]} />
            <Steel />
          </mesh>
          <group position={[POLE.x, HEAD_Y, POLE.z]} rotation={HEAD.rotation}>
            <mesh>
              <boxGeometry args={[...HEAD.size]} />
              <meshStandardMaterial color={PANEL_BLUE} roughness={0.5} />
            </mesh>
            <mesh position={[0, 0, HEAD.lcd.z]} material={lcd.material}>
              <planeGeometry args={[HEAD.lcd.width, HEAD.lcd.height]} />
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

interface BalanzaSceneProps {
  dark?: boolean;
  /** Fades the scene in; hidden scenes ignore input. */
  visible?: boolean;
  /** Starts the letter drop. */
  playing?: boolean;
  /** Called once the WebGL canvas exists. */
  onReady?: () => void;
}

const BalanzaScene = ({ dark = true, visible = true, playing = true, onReady }: BalanzaSceneProps) => {
  const reducedMotion = useReducedMotion();
  const animate = !reducedMotion;

  const [spin] = useState(createSpin);
  const lastPointer = useRef<{ x: number; t: number } | null>(null);
  const invalidateRef = useRef<(() => void) | null>(null);
  const registerInvalidate = useMemo(
    () => (fn: () => void) => {
      invalidateRef.current = fn;
    },
    [],
  );

  const handleDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    lastPointer.current = { x: e.clientX, t: e.timeStamp };
    beginSpin(spin);
    invalidateRef.current?.();
  };
  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const last = lastPointer.current;
    if (!last) return;
    dragSpin(spin, e.clientX - last.x, (e.timeStamp - last.t) / 1000);
    lastPointer.current = { x: e.clientX, t: e.timeStamp };
    invalidateRef.current?.();
  };
  const handleUp = () => {
    lastPointer.current = null;
    endSpin(spin);
    invalidateRef.current?.();
  };

  return (
    <div
      className={`absolute inset-0 touch-pan-y select-none transition-opacity duration-700 ${
        visible ? 'opacity-100 cursor-grab active:cursor-grabbing' : 'opacity-0 pointer-events-none'
      }`}
      aria-hidden="true"
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
    >
      {/* Soft light behind the navy letter so it reads on dark backgrounds */}
      <div
        className={`pointer-events-none absolute inset-x-6 inset-y-2 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.9),rgba(255,255,255,0))] transition-opacity ${
          dark ? 'opacity-10' : 'opacity-0'
        }`}
      />
      <Canvas
        dpr={[1, 1.5]}
        frameloop={animate ? 'always' : 'demand'}
        camera={{ position: CAMERA.position, fov: CAMERA.fov }}
        onCreated={({ camera }) => {
          camera.lookAt(...CAMERA.target);
          onReady?.();
        }}
      >
        <Scene animate={animate} playing={playing} spin={spin} onInvalidate={registerInvalidate} />
      </Canvas>
    </div>
  );
};

export default BalanzaScene;
