import { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import { CatmullRomCurve3, Color, type InstancedMesh, Matrix4, Euler, Quaternion, Vector3 } from 'three';
import { Rod } from '../primitives';
import { mulberry32 } from '../materials/noise';
import { rugTexture } from './rug';

/**
 * PROVISIONAL reading corner in the middle of the room: lounge chair facing the desk and the
 * sea, side table, arc floor lamp (a second warm practical light) and a large plant.
 * Fills the empty centre floor and adds a lived-in zone between workshop, desk and library.
 */

export const CORNER = { x: 2.55, z: -0.05 };

function LoungeChair() {
  const leather = '#7b4a2b';
  const shell = '#3a2516';
  return (
    // Front of the chair is +z before rotation; turned to face the desk and window.
    <group position={[CORNER.x, 0, CORNER.z]} rotation-y={-2.0}>
      {/* Swivel base. */}
      {[0, 1, 2, 3, 4].map((i) => (
        <group key={i} rotation-y={(i / 5) * Math.PI * 2}>
          <Rod from={[0, 0.06, 0]} to={[0.34, 0.03, 0]} radius={0.016} color="#141414" metalness={0.8} roughness={0.3} />
        </group>
      ))}
      <Rod from={[0, 0.06, 0]} to={[0, 0.3, 0]} radius={0.03} color="#141414" metalness={0.8} roughness={0.3} />
      {/* Seat. */}
      <group position={[0, 0.4, 0.04]} rotation-x={-0.1}>
        <RoundedBox args={[0.78, 0.07, 0.66]} radius={0.025} castShadow receiveShadow>
          <meshStandardMaterial color={shell} roughness={0.5} />
        </RoundedBox>
        <RoundedBox args={[0.7, 0.11, 0.6]} radius={0.05} position={[0, 0.08, 0.02]} castShadow>
          <meshStandardMaterial color={leather} roughness={0.55} />
        </RoundedBox>
      </group>
      {/* Back. */}
      <group position={[0, 0.78, -0.3]} rotation-x={-0.42}>
        <RoundedBox args={[0.78, 0.7, 0.06]} radius={0.025} position-z={-0.04} castShadow>
          <meshStandardMaterial color={shell} roughness={0.5} />
        </RoundedBox>
        <RoundedBox args={[0.7, 0.64, 0.12]} radius={0.05} position-z={0.04} castShadow>
          <meshStandardMaterial color={leather} roughness={0.55} />
        </RoundedBox>
      </group>
      {/* Arms. */}
      {[-0.37, 0.37].map((x) => (
        <RoundedBox key={x} args={[0.07, 0.06, 0.52]} radius={0.025} position={[x, 0.6, -0.02]} castShadow>
          <meshStandardMaterial color={leather} roughness={0.55} />
        </RoundedBox>
      ))}
      {/* Ottoman. */}
      <group position={[0, 0, 0.82]}>
        <Rod from={[0, 0.03, 0]} to={[0, 0.24, 0]} radius={0.025} color="#141414" metalness={0.8} roughness={0.3} />
        <RoundedBox args={[0.6, 0.16, 0.48]} radius={0.05} position-y={0.32} castShadow>
          <meshStandardMaterial color={leather} roughness={0.55} />
        </RoundedBox>
      </group>
    </group>
  );
}

function SideTable() {
  return (
    <group position={[CORNER.x - 0.75, 0, CORNER.z - 0.55]}>
      <mesh position-y={0.01}>
        <cylinderGeometry args={[0.16, 0.18, 0.02, 32]} />
        <meshStandardMaterial color="#141414" metalness={0.7} roughness={0.35} />
      </mesh>
      <Rod from={[0, 0.02, 0]} to={[0, 0.5, 0]} radius={0.014} color="#141414" />
      <mesh position-y={0.51} castShadow receiveShadow>
        <cylinderGeometry args={[0.23, 0.23, 0.025, 40]} />
        <meshStandardMaterial color="#8a6a48" roughness={0.5} />
      </mesh>
      {/* Two books and a glass. */}
      <mesh position={[-0.04, 0.537, 0.02]} rotation-y={0.3} castShadow>
        <boxGeometry args={[0.16, 0.025, 0.23]} />
        <meshStandardMaterial color="#2c3d4f" roughness={0.7} />
      </mesh>
      <mesh position={[-0.03, 0.562, 0.03]} rotation-y={0.1} castShadow>
        <boxGeometry args={[0.14, 0.022, 0.21]} />
        <meshStandardMaterial color="#d9d0bf" roughness={0.7} />
      </mesh>
      <mesh position={[0.12, 0.57, -0.08]}>
        <cylinderGeometry args={[0.035, 0.03, 0.09, 24]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.25} roughness={0.05} />
      </mesh>
    </group>
  );
}

/** Arc floor lamp leaning over the chair: warm, low practical light for the centre of the room. */
function ArcLamp() {
  const base = new Vector3(CORNER.x + 0.75, 0, CORNER.z + 0.45);
  const head = new Vector3(CORNER.x + 0.05, 1.62, CORNER.z + 0.05);
  const curve = useMemo(
    () =>
      new CatmullRomCurve3([
        base.clone().setY(0.05),
        base.clone().setY(1.2),
        new Vector3(base.x - 0.12, 1.95, base.z - 0.1),
        new Vector3((base.x + head.x) / 2, 2.05, (base.z + head.z) / 2),
        head.clone().setY(head.y + 0.1),
      ]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  return (
    <group>
      <mesh position={[base.x, 0.04, base.z]} castShadow>
        <cylinderGeometry args={[0.15, 0.16, 0.08, 32]} />
        <meshStandardMaterial color="#e8e4dc" roughness={0.25} />
      </mesh>
      <mesh>
        <tubeGeometry args={[curve, 48, 0.011, 8, false]} />
        <meshStandardMaterial color="#b9b2a6" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={head} castShadow>
        <sphereGeometry args={[0.17, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#1c1c1c" metalness={0.5} roughness={0.4} side={2} />
      </mesh>
      <mesh position={[head.x, head.y - 0.02, head.z]}>
        <sphereGeometry args={[0.045, 16, 12]} />
        <meshStandardMaterial color="#000" emissive="#ffc98a" emissiveIntensity={6} toneMapped={false} />
      </mesh>
      <pointLight position={[head.x, head.y - 0.08, head.z]} intensity={3.2} distance={6} decay={2} color="#ffbe7a" />
    </group>
  );
}

/** Fiddle-leaf fig in a concrete planter, leaves as one instanced mesh. */
function Plant() {
  const leaves = useMemo(() => {
    const rand = mulberry32(99);
    const out: Matrix4[] = [];
    for (let i = 0; i < 46; i++) {
      const h = 0.55 + rand() * 1.15;
      const a = rand() * Math.PI * 2;
      const r = 0.06 + rand() * 0.22 * (h / 1.7);
      const pos = new Vector3(Math.cos(a) * r, h, Math.sin(a) * r);
      const q = new Quaternion().setFromEuler(new Euler(-0.6 + rand() * 0.5, -a + Math.PI / 2, (rand() - 0.5) * 0.6, 'YXZ'));
      out.push(new Matrix4().compose(pos, q, new Vector3(0.11 + rand() * 0.04, 0.012, 0.2 + rand() * 0.07)));
    }
    return out;
  }, []);
  const setup = (mesh: InstancedMesh | null) => {
    if (!mesh) return;
    leaves.forEach((m, i) => {
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, new Color('#2f5a2c').offsetHSL(0, 0, ((i * 13) % 7) / 70 - 0.04));
    });
    mesh.instanceMatrix.needsUpdate = true;
  };
  return (
    <group position={[4.35, 0, 0.6]}>
      <mesh position-y={0.24} castShadow receiveShadow>
        <cylinderGeometry args={[0.24, 0.2, 0.48, 32]} />
        <meshStandardMaterial color="#8d8a84" roughness={0.9} />
      </mesh>
      <mesh position-y={0.47}>
        <cylinderGeometry args={[0.22, 0.22, 0.01, 32]} />
        <meshStandardMaterial color="#1e1612" roughness={1} />
      </mesh>
      <Rod from={[0, 0.45, 0]} to={[0.03, 1.55, -0.02]} radius={0.016} color="#4a3826" metalness={0} roughness={0.9} />
      <Rod from={[0.02, 1.0, 0]} to={[-0.18, 1.45, 0.08]} radius={0.01} color="#4a3826" metalness={0} roughness={0.9} />
      <Rod from={[0.01, 0.9, 0]} to={[0.2, 1.3, 0.1]} radius={0.01} color="#4a3826" metalness={0} roughness={0.9} />
      <instancedMesh ref={setup} args={[undefined, undefined, leaves.length]} castShadow>
        <sphereGeometry args={[1, 12, 8]} />
        <meshStandardMaterial roughness={0.55} />
      </instancedMesh>
    </group>
  );
}

export function ReadingCorner() {
  const rug = rugTexture('lounge', [88, 92, 99], [112, 106, 96]);
  return (
    <group>
      <mesh position={[CORNER.x - 0.1, 0.005, CORNER.z + 0.15]} rotation={[-Math.PI / 2, 0, 0.12]} receiveShadow>
        <planeGeometry args={[2.6, 1.95]} />
        <meshStandardMaterial map={rug} roughness={1} />
      </mesh>
      <LoungeChair />
      <SideTable />
      <ArcLamp />
      <Plant />
    </group>
  );
}
