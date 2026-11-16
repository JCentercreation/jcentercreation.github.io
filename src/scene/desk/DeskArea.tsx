import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import { type SpotLight, Object3D, CatmullRomCurve3, Vector3 } from 'three';
import { useExperience } from '@/app/store';
import { DESK } from '../layout';
import { flat, mat } from '../materials/library';
import { tiledBox } from '../environment/geometry';

/** The lamp shade is open, so its inside must render too (double-sided variant of the hardware finish). */
let shade: ReturnType<typeof mat.blackHardware> | null = null;
function lampShade() {
  if (!shade) {
    shade = mat.blackHardware().clone();
    shade.side = 2;
    shade.name = 'blackHardwareDoubleSided';
  }
  return shade;
}
import { lockScreenTexture } from './deckTextures';
import { DESK_OFFSET, IPAD, MACBOOK, STUDIO_DISPLAY } from '../layout';
import { rugTexture } from '../decor/rug';
import { StudioDisplay } from './StudioDisplay';
import { MagicKeyboard, MagicTrackpad } from './Peripherals';
import { Rod } from '../primitives';
import { Interactive } from '../Interactive';
import { MacBook } from './MacBook';
import { IPad } from './IPad';

const TOP = DESK.height;

function Pedestal({ x }: { x: number }) {
  const h = TOP - 0.06;
  const d = DESK.depth - 0.08;
  return (
    <group position={[x, 0, 0.02]}>
      <mesh position-y={h / 2} castShadow receiveShadow>
        <boxGeometry args={[0.46, h, d]} />
        <primitive object={mat.steel()} attach="material" />
      </mesh>
      {[0.2, 0.42, 0.6].map((y) => (
        <group key={y}>
          <mesh position={[0, y, d / 2 + 0.001]}>
            <boxGeometry args={[0.44, 0.004, 0.002]} />
            <primitive object={flat({ color: '#050505' })} attach="material" />
          </mesh>
          <mesh position={[0, y + 0.05, d / 2 + 0.008]}>
            <boxGeometry args={[0.12, 0.012, 0.012]} />
            <primitive object={mat.darkChrome()} attach="material" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Desk() {
  // One texture spans the whole top: three glued oak boards, no repetition. 6 cm thick slab; the
  // edges now show a thin slice at the same scale instead of the whole top squeezed into 6 cm.
  const slab = useMemo(() => tiledBox(DESK.width, 0.06, DESK.depth, [DESK.width, DESK.depth], 'x', false), []);
  return (
    <group position={[DESK.x, 0, DESK.z]}>
      <mesh position-y={TOP - 0.03} geometry={slab} material={mat.oakDesk()} castShadow receiveShadow />
      {/* Black drawer pedestals at both ends, knee space in the middle. */}
      <Pedestal x={-DESK.width / 2 + 0.26} />
      <Pedestal x={DESK.width / 2 - 0.26} />
      {/* Felt desk pad under the laptop, keyboard and trackpad. */}
      <mesh position={[0.15, TOP + 0.0015, 0.12]} receiveShadow>
        <boxGeometry args={[1.08, 0.003, 0.4]} />
        <meshStandardMaterial color="#2e2c2a" roughness={0.95} />
      </mesh>
    </group>
  );
}

/** Black architect-style desk lamp; owns the warm key light of the room. */
function DeskLamp() {
  const full = useExperience((s) => s.capabilities.tier === 'full');
  const light = useRef<SpotLight>(null);
  const base: [number, number, number] = [-0.32, TOP, -4.0];
  const elbow: [number, number, number] = [-0.36, TOP + 0.38, -4.05];
  const head: [number, number, number] = [-0.12, TOP + 0.47, -3.86];
  const aim = useMemo(() => new Vector3(0.05, TOP, -3.6), []);
  const target = useMemo(() => {
    const o = new Object3D();
    o.position.copy(aim);
    return o;
  }, [aim]);
  // Orient the shade towards the aim point.
  const shadeQuat = useMemo(() => {
    const o = new Object3D();
    o.position.set(...head);
    o.lookAt(aim);
    o.rotateX(Math.PI / 2);
    return o.quaternion.clone();
  }, [aim]);

  return (
    <group>
      <mesh position={[base[0], TOP + 0.008, base[2]]} castShadow receiveShadow>
        <cylinderGeometry args={[0.075, 0.08, 0.016, 32]} />
        <primitive object={mat.blackHardware()} attach="material" />
      </mesh>
      <Rod from={base} to={elbow} radius={0.007} />
      <Rod from={elbow} to={head} radius={0.007} />
      <mesh position={elbow}>
        <sphereGeometry args={[0.013, 16, 12]} />
        <primitive object={mat.blackHardware()} attach="material" />
      </mesh>
      <group position={head} quaternion={shadeQuat}>
        <mesh castShadow>
          <cylinderGeometry args={[0.025, 0.07, 0.12, 32, 1, true]} />
          <primitive object={lampShade()} attach="material" />
        </mesh>
        {/* Bulb: HDR emissive so it blooms. */}
        <mesh position-y={-0.025}>
          <sphereGeometry args={[0.022, 16, 12]} />
          <meshStandardMaterial color="#000" emissive="#ffcf8a" emissiveIntensity={14} toneMapped={false} />
        </mesh>
      </group>
      <primitive object={target} />
      <spotLight
        ref={light}
        position={[head[0], head[1] - 0.03, head[2]]}
        target={target}
        angle={0.85}
        penumbra={0.75}
        intensity={14}
        decay={2}
        color="#ffae62"
        castShadow={full}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
        shadow-normalBias={0.008}
        shadow-radius={6}
        // Default near plane (0.5 m) clipped the display, MacBook and desk top out of the lamp's
        // shadow camera; a tight near/far also improves depth precision (less acne).
        shadow-camera-near={0.05}
        shadow-camera-far={6}
      />
      {/* Warm spill so the lamp's surroundings don't fall to black outside the cone. */}
      <pointLight position={[head[0], head[1] + 0.05, head[2]]} intensity={8} distance={10} decay={2} color="#ffae62" />
    </group>
  );
}

function Cable({ points, color = '#e9e9e7', radius = 0.0022 }: { points: [number, number, number][]; color?: string; radius?: number }) {
  const curve = useMemo(() => new CatmullRomCurve3(points.map((p) => new Vector3(...p)), false, 'centripetal'), [points]);
  return (
    <mesh castShadow>
      <tubeGeometry args={[curve, 64, radius, 6, false]} />
      <meshStandardMaterial color={color} roughness={0.55} />
    </mesh>
  );
}

const T = TOP + 0.0025; // resting on the desk

function DeskProps() {
  const lock = lockScreenTexture();
  const mbLeft = MACBOOK.position.x - MACBOOK.width / 2;
  const ipadLeft = IPAD.position.x - IPAD.width / 2 + 0.004;
  const mbRight = MACBOOK.position.x + MACBOOK.width / 2;
  const dz = STUDIO_DISPLAY.position.z;
  const charger: [number, number, number] = [0.93, TOP, -4.1];
  return (
    <group>
      {/* Notebook (closed, elastic band) with a pen. */}
      <group position={[-0.2, TOP, -3.62]} rotation-y={0.14}>
        <mesh position-y={0.008} castShadow receiveShadow>
          <boxGeometry args={[0.135, 0.016, 0.21]} />
          <meshStandardMaterial color="#161616" roughness={0.75} />
        </mesh>
        <mesh position={[0.0, 0.008, 0]}>
          <boxGeometry args={[0.128, 0.013, 0.205]} />
          <meshStandardMaterial color="#efe8d9" roughness={0.9} />
        </mesh>
        <mesh position={[0.058, 0.0085, 0]}>
          <boxGeometry args={[0.004, 0.0172, 0.212]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.6} />
        </mesh>
        <mesh position={[-0.02, 0.0185, 0.01]} rotation={[0, 0.5, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.0045, 0.0045, 0.14, 12]} />
          <meshStandardMaterial color="#1a2a44" metalness={0.5} roughness={0.35} />
        </mesh>
      </group>

      {/* iPhone face up on the desk pad, lock screen dimly lit. */}
      <group position={[0.06, TOP + 0.003, -3.5]} rotation-y={0.32}>
        <RoundedBox args={[0.0716, 0.0083, 0.1476]} radius={0.0035} smoothness={3} position-y={0.0042} castShadow>
          <meshStandardMaterial color="#5a5c60" metalness={0.85} roughness={0.3} />
        </RoundedBox>
        <mesh position-y={0.0085} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[0.0685, 0.1445]} />
          <meshStandardMaterial color="#000" roughness={0.05} />
        </mesh>
        <mesh position-y={0.0087} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[0.066, 0.142]} />
          <meshBasicMaterial map={lock} toneMapped={false} color={[0.55, 0.55, 0.55]} />
        </mesh>
      </group>

      {/* AirPods Pro case. */}
      <RoundedBox args={[0.06, 0.022, 0.045]} radius={0.01} smoothness={4} position={[1.4, TOP + 0.011, -3.78]} rotation-y={-0.4} castShadow>
        <meshStandardMaterial color="#f4f4f2" roughness={0.3} />
      </RoundedBox>

      {/* Mug. */}
      <group position={[1.3, TOP, -3.5]}>
        <mesh position-y={0.048} castShadow>
          <cylinderGeometry args={[0.042, 0.04, 0.096, 32]} />
          <primitive object={flat({ color: '#2b2b2b', roughness: 0.45 })} attach="material" />
        </mesh>
        <mesh position={[0.046, 0.05, 0]} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.022, 0.006, 8, 16, Math.PI]} />
          <primitive object={flat({ color: '#2b2b2b', roughness: 0.45 })} attach="material" />
        </mesh>
      </group>

      {/* Compact USB-C charger at the back of the desk. */}
      <RoundedBox args={[0.045, 0.03, 0.06]} radius={0.006} position={[charger[0], TOP + 0.015, charger[2]]} castShadow>
        <meshStandardMaterial color="#e7e7e5" roughness={0.4} />
      </RoundedBox>

      {/* MagSafe 3 (silver braided) from the MacBook's left side, off the back edge, down to the floor. */}
      <Cable
        color="#b9bbbe"
        points={[
          [mbLeft - 0.004, TOP + 0.008, -3.8],
          [mbLeft - 0.06, T, -3.83],
          [mbLeft - 0.12, T, -3.98],
          [mbLeft - 0.13, T, -4.16],
          [mbLeft - 0.13, TOP - 0.03, -4.21],
          [mbLeft - 0.1, 0.35, -4.24],
          [mbLeft - 0.02, 0.02, -4.26],
        ]}
      />
      {/* iPad USB-C (from its left short edge) to the charger. */}
      <Cable
        points={[
          [ipadLeft - 0.004, TOP + 0.004, IPAD.position.z + 0.01],
          [ipadLeft - 0.04, T, IPAD.position.z - 0.02],
          [charger[0] + 0.02, T, -4.0],
          [charger[0], TOP + 0.012, charger[2] + 0.03],
        ]}
      />
      {/* Thunderbolt: MacBook right side → behind the laptop → up into the back of the display. */}
      <Cable
        color="#d9d9d7"
        radius={0.0024}
        points={[
          [mbRight + 0.003, TOP + 0.007, -3.8],
          [mbRight + 0.05, T, -3.84],
          [mbRight + 0.06, T, -3.97],
          [STUDIO_DISPLAY.position.x + 0.12, T, dz - 0.07],
          [STUDIO_DISPLAY.position.x + 0.06, TOP + 0.06, dz - 0.075],
          [STUDIO_DISPLAY.position.x + 0.02, TOP + 0.16, dz - 0.05],
        ]}
      />
      {/* Display power cord down behind the desk. */}
      <Cable
        color="#d9d9d7"
        radius={0.0028}
        points={[
          [STUDIO_DISPLAY.position.x - 0.02, TOP + 0.16, dz - 0.05],
          [STUDIO_DISPLAY.position.x - 0.05, TOP + 0.05, dz - 0.09],
          [STUDIO_DISPLAY.position.x - 0.07, T, -4.17],
          [STUDIO_DISPLAY.position.x - 0.08, TOP - 0.05, -4.21],
          [STUDIO_DISPLAY.position.x - 0.06, 0.02, -4.26],
        ]}
      />
      {/* Charger lead down behind the desk. */}
      <Cable
        points={[
          [charger[0], TOP + 0.012, charger[2] - 0.03],
          [charger[0] + 0.01, T, -4.17],
          [charger[0] + 0.02, TOP - 0.04, -4.21],
          [charger[0] + 0.05, 0.3, -4.24],
          [charger[0] + 0.1, 0.02, -4.26],
        ]}
      />
    </group>
  );
}

/** Jute rug in front of the desk (reference): warm, woven, low contrast. */
function Rug() {
  const jute = rugTexture('jute', [150, 116, 78], [118, 88, 58]);
  return (
    <mesh position={[DESK.x, 0.004, DESK.z + 1.25]} rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[2.5, 1.7]} />
      <meshStandardMaterial map={jute} roughness={1} />
    </mesh>
  );
}

/** Small potted plant on the desk, left of the display. */
function DeskPlant() {
  return (
    <group position={[-0.06, TOP, -4.0]}>
      <mesh position-y={0.055} castShadow>
        <cylinderGeometry args={[0.055, 0.045, 0.11, 24]} />
        <meshStandardMaterial color="#d8d3c8" roughness={0.6} />
      </mesh>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <mesh key={i} position={[Math.cos(i * 0.9) * 0.05, 0.17 + (i % 3) * 0.03, Math.sin(i * 0.9) * 0.05]} rotation={[0.6 * Math.sin(i), i * 0.9, 0.5]} scale={[0.07, 0.008, 0.035]} castShadow>
          <sphereGeometry args={[1, 10, 6]} />
          <primitive object={flat({ color: '#3f6a2e', roughness: 0.55 })} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

function Chair() {
  const legs = [0, 1, 2, 3, 4].map((i) => (i / 5) * Math.PI * 2);
  return (
    // Centred at the desk, facing the window (reference): we see its back from the overview.
    <group position={[DESK.x + 0.05, 0, DESK.z + 0.78]} rotation-y={0.06}>
      <RoundedBox args={[0.5, 0.07, 0.48]} radius={0.02} position-y={0.48} castShadow>
        <primitive object={mat.leatherTan()} attach="material" />
      </RoundedBox>
      {/* Mid-back leather chair (reference): the back stays below the screens from the overview. */}
      <group position={[0, 0.74, 0.23]} rotation-x={-0.12}>
        <RoundedBox args={[0.47, 0.42, 0.06]} radius={0.025} castShadow>
          <primitive object={mat.leatherTan()} attach="material" />
        </RoundedBox>
      </group>
      <Rod from={[0, 0.1, 0]} to={[0, 0.45, 0]} radius={0.022} color="#2a2b2d" metalness={0.8} roughness={0.3} />
      <Rod from={[0, 0.45, 0.2]} to={[0, 0.62, 0.24]} radius={0.015} color="#2a2b2d" metalness={0.8} roughness={0.3} />
      {legs.map((a) => (
        <group key={a} rotation-y={a}>
          <Rod from={[0, 0.1, 0]} to={[0.3, 0.06, 0]} radius={0.016} color="#141415" metalness={0.6} roughness={0.4} />
          <mesh position={[0.3, 0.03, 0]}>
            <sphereGeometry args={[0.028, 12, 10]} />
            <primitive object={flat({ color: '#0d0d0e', roughness: 0.6 })} attach="material" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function DeskArea() {
  const shot = useExperience((s) => s.shot);
  return (
    // The desk set is authored in its own frame and placed under the window as one unit.
    <group position={DESK_OFFSET}>
      <Interactive id="desk" enabled={shot === 'overview'} onSelect={() => useExperience.getState().goTo('desk')}>
        <Desk />
        <Chair />
        <Rug />
        <DeskPlant />
      </Interactive>
      <DeskLamp />
      <DeskProps />
      <StudioDisplay />
      <MacBook />
      <MagicKeyboard />
      <MagicTrackpad />
      <IPad />
    </group>
  );
}
