import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import { type SpotLight, Object3D, CatmullRomCurve3, Vector3 } from 'three';
import { useExperience } from '@/app/store';
import { DESK } from '../layout';
import { oakDesk } from '../materials/proceduralTextures';
import { lockScreenTexture } from './deckTextures';
import { IPAD, MACBOOK } from '../layout';
import { Rod } from '../primitives';
import { Interactive } from '../Interactive';
import { MacBook } from './MacBook';
import { IPad } from './IPad';

const TOP = DESK.height;

function Desk() {
  // One texture spans the whole top: three glued oak boards, no repetition.
  const oak = oakDesk();
  const legX = DESK.width / 2 - 0.08;
  return (
    <group position={[DESK.x, 0, DESK.z]}>
      <mesh position-y={TOP - 0.02} castShadow receiveShadow>
        <boxGeometry args={[DESK.width, 0.04, DESK.depth]} />
        <meshStandardMaterial {...oak} normalScale={[0.3, 0.3]} />
      </mesh>
      {/* Black steel trestle legs. */}
      {[-legX, legX].map((x) => (
        <group key={x} position-x={x}>
          {[-DESK.depth / 2 + 0.05, DESK.depth / 2 - 0.05].map((z) => (
            <mesh key={z} position={[0, (TOP - 0.04) / 2, z]} castShadow>
              <boxGeometry args={[0.04, TOP - 0.04, 0.04]} />
              <meshStandardMaterial color="#121314" metalness={0.75} roughness={0.45} />
            </mesh>
          ))}
          {[0.06, TOP - 0.07].map((y) => (
            <mesh key={y} position={[0, y, 0]} castShadow>
              <boxGeometry args={[0.04, 0.03, DESK.depth - 0.1]} />
              <meshStandardMaterial color="#121314" metalness={0.75} roughness={0.45} />
            </mesh>
          ))}
        </group>
      ))}
      {/* Felt desk pad under the laptop. */}
      <mesh position={[-0.05, TOP + 0.0015, 0.05]} receiveShadow>
        <boxGeometry args={[0.82, 0.003, 0.42]} />
        <meshStandardMaterial color="#3b3936" roughness={0.95} />
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
        <meshStandardMaterial color="#0f0f10" metalness={0.6} roughness={0.35} />
      </mesh>
      <Rod from={base} to={elbow} radius={0.007} />
      <Rod from={elbow} to={head} radius={0.007} />
      <mesh position={elbow}>
        <sphereGeometry args={[0.013, 16, 12]} />
        <meshStandardMaterial color="#0f0f10" metalness={0.6} roughness={0.35} />
      </mesh>
      <group position={head} quaternion={shadeQuat}>
        <mesh castShadow>
          <cylinderGeometry args={[0.025, 0.07, 0.12, 32, 1, true]} />
          <meshStandardMaterial color="#0f0f10" metalness={0.5} roughness={0.4} side={2} />
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
        intensity={9}
        decay={2}
        color="#ffb36b"
        castShadow={full}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0002}
        shadow-radius={4}
      />
      {/* Warm spill so the lamp's surroundings don't fall to black outside the cone. */}
      <pointLight position={[head[0], head[1] + 0.05, head[2]]} intensity={1.6} distance={4} decay={2} color="#ffb36b" />
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
  const ipadRight = IPAD.position.x + IPAD.width / 2 - 0.004;
  const charger: [number, number, number] = [1.06, TOP, -4.08];
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
      <RoundedBox args={[0.06, 0.022, 0.045]} radius={0.01} smoothness={4} position={[-0.06, TOP + 0.011, -3.88]} rotation-y={-0.4} castShadow>
        <meshStandardMaterial color="#f4f4f2" roughness={0.3} />
      </RoundedBox>

      {/* Mug. */}
      <group position={[1.3, TOP, -3.5]}>
        <mesh position-y={0.048} castShadow>
          <cylinderGeometry args={[0.042, 0.04, 0.096, 32]} />
          <meshStandardMaterial color="#2b2b2b" roughness={0.45} />
        </mesh>
        <mesh position={[0.046, 0.05, 0]} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.022, 0.006, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#2b2b2b" roughness={0.45} />
        </mesh>
      </group>

      {/* Over-ear headphones lying on the desk. */}
      <group position={[1.22, TOP + 0.04, -3.98]} rotation-y={0.5}>
        <mesh>
          <torusGeometry args={[0.085, 0.009, 8, 32, Math.PI]} />
          <meshStandardMaterial color="#1e1f22" roughness={0.5} />
        </mesh>
        {[-0.085, 0.085].map((x) => (
          <mesh key={x} position={[x, 0, 0]} rotation-z={Math.PI / 2} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.035, 24]} />
            <meshStandardMaterial color="#26272a" roughness={0.6} />
          </mesh>
        ))}
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
      {/* iPad USB-C to the charger. */}
      <Cable
        points={[
          [ipadRight + 0.004, TOP + 0.004, IPAD.position.z + 0.02],
          [ipadRight + 0.05, T, IPAD.position.z - 0.02],
          [ipadRight + 0.03, T, -3.95],
          [charger[0] - 0.01, T, charger[2] + 0.06],
          [charger[0], TOP + 0.012, charger[2] + 0.03],
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

/** Dark wool rug that anchors the office zone on the concrete. */
function Rug() {
  return (
    <mesh position={[DESK.x + 0.1, 0.004, DESK.z + 1.0]} rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[2.7, 2.0]} />
      <meshStandardMaterial color="#2e2a27" roughness={1} />
    </mesh>
  );
}

function Chair() {
  const legs = [0, 1, 2, 3, 4].map((i) => (i / 5) * Math.PI * 2);
  return (
    // Pushed back and turned aside, as if just stood up from — keeps the MacBook visible.
    <group position={[1.05, 0, -2.85]} rotation-y={1.05}>
      <RoundedBox args={[0.5, 0.07, 0.48]} radius={0.02} position-y={0.48} castShadow>
        <meshStandardMaterial color="#1b1b1d" roughness={0.9} />
      </RoundedBox>
      <group position={[0, 0.82, 0.23]} rotation-x={-0.12}>
        <RoundedBox args={[0.47, 0.55, 0.05]} radius={0.02} castShadow>
          <meshStandardMaterial color="#1b1b1d" roughness={0.9} />
        </RoundedBox>
      </group>
      <Rod from={[0, 0.1, 0]} to={[0, 0.45, 0]} radius={0.022} color="#2a2b2d" metalness={0.8} roughness={0.3} />
      <Rod from={[0, 0.45, 0.2]} to={[0, 0.62, 0.24]} radius={0.015} color="#2a2b2d" metalness={0.8} roughness={0.3} />
      {legs.map((a) => (
        <group key={a} rotation-y={a}>
          <Rod from={[0, 0.1, 0]} to={[0.3, 0.06, 0]} radius={0.016} color="#141415" metalness={0.6} roughness={0.4} />
          <mesh position={[0.3, 0.03, 0]}>
            <sphereGeometry args={[0.028, 12, 10]} />
            <meshStandardMaterial color="#0d0d0e" roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function DeskArea() {
  const shot = useExperience((s) => s.shot);
  return (
    <group>
      <Interactive id="desk" enabled={shot === 'overview'} onSelect={() => useExperience.getState().goTo('desk')}>
        <Desk />
        <Chair />
        <Rug />
      </Interactive>
      <DeskLamp />
      <DeskProps />
      <MacBook />
      <IPad />
    </group>
  );
}
