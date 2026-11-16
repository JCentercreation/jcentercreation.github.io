import { useMemo } from 'react';
import { type Material, Quaternion, Vector3 } from 'three';
import { flat } from './materials/library';

/** A cylinder spanning two points — used for lamp arms, chair legs, tool handles. */
export function Rod({
  from,
  to,
  radius,
  color = '#111',
  metalness = 0.6,
  roughness = 0.4,
  castShadow = true,
  material,
}: {
  from: [number, number, number];
  to: [number, number, number];
  radius: number;
  color?: string;
  metalness?: number;
  roughness?: number;
  castShadow?: boolean;
  /** A shared library material (overrides colour/metalness/roughness). */
  material?: Material;
}) {
  const { position, quaternion, length } = useMemo(() => {
    const a = new Vector3(...from);
    const b = new Vector3(...to);
    const dir = b.clone().sub(a);
    const q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir.clone().normalize());
    return { position: a.add(b).multiplyScalar(0.5), quaternion: q, length: dir.length() };
  }, [from, to]);
  return (
    <mesh position={position} quaternion={quaternion} castShadow={castShadow} material={material ?? flat({ color, metalness, roughness })}>
      <cylinderGeometry args={[radius, radius, length, 12]} />
    </mesh>
  );
}
