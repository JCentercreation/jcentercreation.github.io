import { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import { CatmullRomCurve3, LatheGeometry, Object3D, Vector2, Vector3 } from 'three';
import { ROOM, TIMBER, carLocalToWorld } from '../layout';
import { pegboard } from '../materials/proceduralTextures';
import { Rod } from '../primitives';

const STEEL = { color: '#1a1b1d', metalness: 0.7, roughness: 0.45 };

/** Rolling tool chest against the left wall. */
function ToolChest() {
  return (
    <group position={[ROOM.minX + 0.3, 0, -3.15]} rotation-y={Math.PI / 2}>
      <RoundedBox args={[0.78, 0.92, 0.46]} radius={0.012} position-y={0.52} castShadow receiveShadow>
        <meshStandardMaterial color="#7d1714" metalness={0.5} roughness={0.38} />
      </RoundedBox>
      {Array.from({ length: 6 }, (_, i) => (
        <group key={i} position={[0, 0.2 + i * 0.13, 0.232]}>
          <mesh>
            <boxGeometry args={[0.72, 0.004, 0.004]} />
            <meshStandardMaterial color="#2a0807" />
          </mesh>
          <mesh position={[0, 0.06, 0.008]}>
            <boxGeometry args={[0.5, 0.012, 0.014]} />
            <meshStandardMaterial color="#c7c9cc" metalness={0.9} roughness={0.25} />
          </mesh>
        </group>
      ))}
      {[-0.33, 0.33].map((x) =>
        [-0.18, 0.18].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.04, z]} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[0.04, 0.04, 0.03, 16]} />
            <meshStandardMaterial color="#111" roughness={0.6} />
          </mesh>
        )),
      )}
      {/* A torque wrench and a multimeter on top. */}
      <mesh position={[-0.1, 1.0, 0]} rotation={[0, 0.3, Math.PI / 2]}>
        <cylinderGeometry args={[0.011, 0.011, 0.5, 10]} />
        <meshStandardMaterial color="#b9bcc0" metalness={0.9} roughness={0.25} />
      </mesh>
      <RoundedBox args={[0.09, 0.04, 0.17]} radius={0.008} position={[0.22, 1.0, 0.02]} rotation-y={-0.3} castShadow>
        <meshStandardMaterial color="#e3b100" roughness={0.5} />
      </RoundedBox>
    </group>
  );
}

/** Pegboard with hand tools on the left wall. */
function Pegboard() {
  const tex = pegboard();
  const tools: [number, number, number, number, string][] = [
    // z, y, length, angle, colour
    [-2.7, 1.62, 0.26, 0, '#b9bcc0'],
    [-2.55, 1.6, 0.22, 0, '#b9bcc0'],
    [-2.42, 1.58, 0.19, 0, '#b9bcc0'],
    [-2.3, 1.57, 0.16, 0, '#b9bcc0'],
    [-1.95, 1.62, 0.24, 0, '#e3b100'],
    [-1.82, 1.62, 0.24, 0, '#d0321e'],
    [-1.69, 1.62, 0.22, 0, '#1c1c1c'],
    [-1.35, 1.3, 0.32, 0.6, '#b9bcc0'],
    [-1.15, 1.3, 0.28, -0.6, '#d0321e'],
  ];
  return (
    <group>
      <mesh position={[ROOM.minX + 0.012, 1.55, -2.0]} rotation-y={Math.PI / 2} receiveShadow>
        <planeGeometry args={[2.0, 0.95]} />
        <meshStandardMaterial map={tex} roughness={0.85} />
      </mesh>
      {tools.map(([z, y, len, a, col], i) => (
        <mesh key={i} position={[ROOM.minX + 0.03, y, z]} rotation-x={a} castShadow>
          <boxGeometry args={[0.012, len, 0.022]} />
          <meshStandardMaterial color={col} metalness={col === '#b9bcc0' ? 0.9 : 0.1} roughness={0.35} />
        </mesh>
      ))}
      {/* Coiled cable hanging from a hook. */}
      <mesh position={[ROOM.minX + 0.06, 1.55, -1.25 + 0.6]} rotation-y={Math.PI / 2}>
        <torusGeometry args={[0.13, 0.012, 8, 32]} />
        <meshStandardMaterial color="#d9661f" roughness={0.6} />
      </mesh>
    </group>
  );
}

/** Mobile diagnostic station near the car's nose. */
function DiagnosticCart() {
  return (
    <group position={[-5.0, 0, 1.55]} rotation-y={0.9}>
      {[0.12, 0.55, 0.92].map((y) => (
        <mesh key={y} position-y={y} castShadow receiveShadow>
          <boxGeometry args={[0.6, 0.025, 0.42]} />
          <meshStandardMaterial {...STEEL} />
        </mesh>
      ))}
      {[-0.28, 0.28].map((x) =>
        [-0.19, 0.19].map((z) => <Rod key={`${x}${z}`} from={[x, 0.06, z]} to={[x, 0.93, z]} radius={0.012} color="#1a1b1d" />),
      )}
      {/* Oscilloscope-style instrument with a lit screen. */}
      <RoundedBox args={[0.38, 0.22, 0.26]} radius={0.01} position={[0, 1.045, 0]} castShadow>
        <meshStandardMaterial color="#2c2e31" roughness={0.6} />
      </RoundedBox>
      <mesh position={[-0.05, 1.05, 0.131]}>
        <planeGeometry args={[0.2, 0.13]} />
        <meshStandardMaterial color="#000" emissive="#39c0a8" emissiveIntensity={1.4} />
      </mesh>
      <RoundedBox args={[0.32, 0.1, 0.24]} radius={0.01} position={[0, 0.62, 0]} castShadow>
        <meshStandardMaterial color="#e3b100" roughness={0.5} />
      </RoundedBox>
    </group>
  );
}

function TyreStack() {
  const g = useMemo(() => {
    const pts = [new Vector2(0.22, -0.11), new Vector2(0.32, -0.115), new Vector2(0.335, 0), new Vector2(0.32, 0.115), new Vector2(0.22, 0.11)];
    return new LatheGeometry(pts, 36);
  }, []);
  return (
    <group position={[ROOM.minX + 0.55, 0, ROOM.minZ + 0.5]}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} geometry={g} position={[(i % 2) * 0.02, 0.115 + i * 0.235, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#121213" roughness={0.9} side={2} />
        </mesh>
      ))}
    </group>
  );
}

/** Wall charger on the back wall, cable to the charge port (rear left of the car). */
function WallCharger() {
  // Between the garage doors and the window.
  const mount = new Vector3(-1.72, 1.2, ROOM.minZ + 0.05);
  const port = carLocalToWorld(new Vector3(-2.05, 0.84, -0.86));
  const cable = useMemo(
    () =>
      new CatmullRomCurve3([
        mount.clone().add(new Vector3(0, -0.14, 0.02)),
        mount.clone().add(new Vector3(0.05, -0.6, 0.15)),
        new Vector3((mount.x + port.x) / 2, 0.04, (mount.z + port.z) / 2 + 0.2),
        port.clone().add(new Vector3(0.12, -0.5, 0.1)),
        port,
      ]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  return (
    <group>
      <RoundedBox args={[0.2, 0.34, 0.08]} radius={0.03} position={mount} castShadow>
        <meshStandardMaterial color="#e9e9e7" roughness={0.35} />
      </RoundedBox>
      <mesh position={mount.clone().add(new Vector3(0, 0.06, 0.041))}>
        <planeGeometry args={[0.1, 0.008]} />
        <meshStandardMaterial color="#000" emissive="#3fa9ff" emissiveIntensity={2} />
      </mesh>
      <mesh>
        <tubeGeometry args={[cable, 60, 0.009, 8, false]} />
        <meshStandardMaterial color="#1b1b1c" roughness={0.6} />
      </mesh>
    </group>
  );
}

/**
 * Ceiling track with three small spots aimed at the car — natural, directional workshop light
 * instead of a glaring batten. Spots cast no shadows (cost), the lamp and window do.
 */
function TrackLights() {
  const heads = useMemo(() => {
    const out: { pos: Vector3; aim: Object3D }[] = [];
    for (const lx of [-1.3, 0.1, 1.4]) {
      const onCar = carLocalToWorld(new Vector3(lx, 0.7, -0.15));
      // Track runs above the room side of the car, so light rakes the driver side.
      const pos = carLocalToWorld(new Vector3(lx, 0, -1.7));
      // Hung just below the glulam beams.
      pos.y = ROOM.height - TIMBER.joistH - TIMBER.beamH - 0.1;
      const aim = new Object3D();
      aim.position.copy(onCar);
      out.push({ pos, aim });
    }
    return out;
  }, []);
  const a = heads[0]!.pos;
  const b = heads[2]!.pos;
  return (
    <group>
      <Rod from={[a.x, a.y + 0.05, a.z]} to={[b.x, b.y + 0.05, b.z]} radius={0.012} color="#111" castShadow={false} />
      {heads.map(({ pos, aim }, i) => {
        const q = new Object3D();
        q.position.copy(pos);
        q.lookAt(aim.position);
        return (
          <group key={i}>
            <group position={pos} quaternion={q.quaternion}>
              <mesh rotation-x={Math.PI / 2}>
                <cylinderGeometry args={[0.035, 0.03, 0.12, 20]} />
                <meshStandardMaterial color="#111" metalness={0.6} roughness={0.4} />
              </mesh>
              <mesh position-z={0.061}>
                <circleGeometry args={[0.026, 20]} />
                <meshStandardMaterial color="#000" emissive="#fff1dd" emissiveIntensity={2.2} toneMapped={false} />
              </mesh>
            </group>
            <primitive object={aim} />
            <spotLight position={pos} target={aim} angle={0.42} penumbra={0.9} intensity={26} decay={2} color="#ffe9cf" />
          </group>
        );
      })}
    </group>
  );
}

/** A faint oil stain under the car: work happens here. */
function FloorDetails() {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[carLocalToWorld(new Vector3(0.3, 0, 0)).x, 0.003, carLocalToWorld(new Vector3(0.3, 0, 0)).z]}>
        <circleGeometry args={[0.35, 32]} />
        <meshStandardMaterial color="#1a1814" roughness={0.4} transparent opacity={0.45} />
      </mesh>
    </group>
  );
}

export function Workshop() {
  return (
    <group>
      <ToolChest />
      <Pegboard />
      <DiagnosticCart />
      <TyreStack />
      <WallCharger />
      <TrackLights />
      <FloorDetails />
    </group>
  );
}
