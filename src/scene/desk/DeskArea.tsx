import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import { type SpotLight, Object3D, CatmullRomCurve3, Vector3 } from 'three';
import { useExperience } from '@/app/store';
import { DESK } from '../layout';
import { oakWood } from '../materials/proceduralTextures';
import { Rod } from '../primitives';
import { Interactive } from '../Interactive';
import { MacBook } from './MacBook';
import { IPad } from './IPad';

const TOP = DESK.height;

function Desk() {
  const oak = oakWood();
  const legX = DESK.width / 2 - 0.08;
  return (
    <group position={[DESK.x, 0, DESK.z]}>
      <RoundedBox args={[DESK.width, 0.04, DESK.depth]} radius={0.006} position-y={TOP - 0.02} castShadow receiveShadow>
        <meshStandardMaterial {...oak} normalScale={[0.25, 0.25]} />
      </RoundedBox>
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

function DeskProps() {
  const cable = useMemo(
    () =>
      new CatmullRomCurve3([
        new Vector3(0.22, TOP + 0.006, -3.72),
        new Vector3(0.1, TOP + 0.003, -3.8),
        new Vector3(0.0, TOP + 0.002, -4.05),
        new Vector3(-0.1, TOP + 0.002, -4.17),
        new Vector3(-0.12, TOP - 0.1, -4.2),
        new Vector3(-0.1, 0.25, -4.25),
      ]),
    [],
  );
  return (
    <group>
      {/* Notebook with elastic band, iPhone on top. */}
      <group position={[-0.17, TOP, -3.6]} rotation-y={0.18}>
        <mesh position-y={0.008} castShadow receiveShadow>
          <boxGeometry args={[0.135, 0.016, 0.21]} />
          <meshStandardMaterial color="#141414" roughness={0.75} />
        </mesh>
        <mesh position={[0.067, 0.008, 0]}>
          <boxGeometry args={[0.004, 0.0165, 0.21]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.6} />
        </mesh>
        <group position={[0.005, 0.0165, 0.01]} rotation-y={-0.32}>
          <RoundedBox args={[0.0716, 0.0083, 0.1476]} radius={0.003} smoothness={3} position-y={0.0042} castShadow>
            <meshStandardMaterial color="#4a4b4e" metalness={0.85} roughness={0.3} />
          </RoundedBox>
          <mesh position-y={0.0085} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[0.066, 0.142]} />
            <meshStandardMaterial color="#020202" roughness={0.05} />
          </mesh>
        </group>
      </group>

      {/* Mug. */}
      <group position={[1.3, TOP, -3.5]}>
        <mesh position-y={0.048} castShadow>
          <cylinderGeometry args={[0.042, 0.04, 0.096, 32]} />
          <meshStandardMaterial color="#d9d5cc" roughness={0.3} />
        </mesh>
        <mesh position={[0.046, 0.05, 0]} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.022, 0.006, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#d9d5cc" roughness={0.3} />
        </mesh>
      </group>

      {/* Over-ear headphones lying on the desk. */}
      <group position={[1.2, TOP + 0.04, -3.98]} rotation-y={0.5}>
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

      {/* USB-C charging cable off the back of the desk. */}
      <mesh>
        <tubeGeometry args={[cable, 40, 0.0025, 6, false]} />
        <meshStandardMaterial color="#e8e8e6" roughness={0.5} />
      </mesh>
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
