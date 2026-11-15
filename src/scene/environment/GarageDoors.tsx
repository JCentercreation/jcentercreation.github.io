import { useMemo } from 'react';
import type { Texture } from 'three';
import { GARAGE_DOOR, ROOM } from '../layout';
import { doorBoards } from '../materials/proceduralTextures';

/**
 * PROVISIONAL carriage-style double garage doors: vertical oak boards, a band of glass lites,
 * black steel strap hinges, pulls and a steel lintel. Contemporary proportions, no rustic X-bracing.
 */
const STEEL = { color: '#121314', metalness: 0.75, roughness: 0.4 } as const;

function verticalBoards(): { map: Texture; roughnessMap: Texture; normalMap: Texture } {
  const src = doorBoards();
  const rot = (t: Texture) => {
    const c = t.clone();
    c.center.set(0.5, 0.5);
    c.rotation = Math.PI / 2;
    c.repeat.set(2.45 / 1.2, 1.35 / 1.2);
    c.needsUpdate = true;
    return c;
  };
  return { map: rot(src.map), roughnessMap: rot(src.roughnessMap), normalMap: rot(src.normalMap) };
}

function Leaf({ x, mirrored }: { x: number; mirrored: boolean }) {
  const boards = useMemo(verticalBoards, []);
  const w = GARAGE_DOOR.width / 2 - 0.01;
  const h = GARAGE_DOOR.height - 0.01;
  const hingeSide = mirrored ? w / 2 - 0.02 : -w / 2 + 0.02;
  return (
    <group position={[x, h / 2, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, 0.05]} />
        <meshStandardMaterial {...boards} normalScale={[0.8, 0.8]} />
      </mesh>
      {/* Two rows of glass lites in the upper band, with black glazing bars. */}
      {Array.from({ length: 2 }, (_, r) =>
        Array.from({ length: 4 }, (_, i) => {
          const lw = (w - 0.2) / 4;
          return (
            <mesh key={`${r}-${i}`} position={[-w / 2 + 0.1 + lw * (i + 0.5), h / 2 - 0.2 - r * 0.2, 0.026]}>
              <boxGeometry args={[lw - 0.035, 0.165, 0.006]} />
              <meshStandardMaterial color="#05080d" emissive="#1b2d48" emissiveIntensity={0.55} roughness={0.05} metalness={0.2} />
            </mesh>
          );
        }),
      )}
      {/* Oak rail under the glass band. */}
      <mesh position={[0, h / 2 - 0.55, 0.028]}>
        <boxGeometry args={[w - 0.04, 0.07, 0.012]} />
        <meshStandardMaterial color="#6b4c30" roughness={0.6} />
      </mesh>
      {/* Strap hinges. */}
      {[-0.85, 0.05, 0.75].map((y) => (
        <group key={y} position={[hingeSide + (mirrored ? -0.26 : 0.26), y, 0.03]}>
          <mesh>
            <boxGeometry args={[0.55, 0.045, 0.008]} />
            <meshStandardMaterial {...STEEL} />
          </mesh>
          {[-0.2, 0, 0.2].map((dx) => (
            <mesh key={dx} position={[dx, 0, 0.006]} rotation-x={Math.PI / 2}>
              <cylinderGeometry args={[0.008, 0.008, 0.006, 10]} />
              <meshStandardMaterial {...STEEL} />
            </mesh>
          ))}
        </group>
      ))}
      {/* Vertical pull near the meeting stiles. */}
      <mesh position={[mirrored ? -w / 2 + 0.09 : w / 2 - 0.09, 0, 0.06]} castShadow>
        <boxGeometry args={[0.022, 0.42, 0.022]} />
        <meshStandardMaterial {...STEEL} />
      </mesh>
    </group>
  );
}

export function GarageDoors() {
  const { centerX, width, height } = GARAGE_DOOR;
  const z = ROOM.minZ - ROOM.wallThickness * 0.5;
  return (
    <group position={[0, 0, z]}>
      <Leaf x={centerX - width / 4} mirrored={false} />
      <Leaf x={centerX + width / 4} mirrored />
      {/* Black steel lintel and jambs. */}
      <mesh position={[centerX, height + 0.06, ROOM.wallThickness * 0.5 + 0.02]} castShadow>
        <boxGeometry args={[width + 0.24, 0.12, 0.05]} />
        <meshStandardMaterial {...STEEL} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[centerX + s * (width / 2 + 0.06), height / 2, ROOM.wallThickness * 0.5 + 0.02]} castShadow>
          <boxGeometry args={[0.12, height, 0.05]} />
          <meshStandardMaterial {...STEEL} />
        </mesh>
      ))}
    </group>
  );
}
