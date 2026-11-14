import type { ReactNode } from 'react';
import { RoundedBox } from '@react-three/drei';
import type { Texture } from 'three';

export interface LaptopProps {
  width: number;
  depth: number;
  thickness: number;
  lidAngle: number;
  bodyColor: string;
  screen: Texture;
  /** Screen glow multiplier (hover feedback). */
  glow?: number;
  /** Display area as a fraction of the lid. */
  display?: [number, number];
  children?: ReactNode;
}

/**
 * PROVISIONAL generic laptop: base + keyboard deck + lid with a live screen texture.
 * Front (user side) is +z, hinge at -z. Final MacBook will be a proper model; the screen
 * stays a separate mesh so the content pipeline doesn't change.
 */
export function LaptopModel({
  width,
  depth,
  thickness,
  lidAngle,
  bodyColor,
  screen,
  glow = 1,
  display = [0.965, 0.89],
  children,
}: LaptopProps) {
  const lidH = depth * 0.985;
  return (
    <group>
      <RoundedBox args={[width, thickness, depth]} radius={thickness * 0.45} smoothness={3} position-y={thickness / 2} castShadow receiveShadow>
        <meshStandardMaterial color={bodyColor} metalness={0.85} roughness={0.32} />
      </RoundedBox>
      {/* Keyboard well + trackpad. */}
      <mesh position={[0, thickness + 0.0003, -depth * 0.14]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[width * 0.86, depth * 0.44]} />
        <meshStandardMaterial color="#0c0c0d" roughness={0.6} />
      </mesh>
      <mesh position={[0, thickness + 0.0003, depth * 0.28]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[width * 0.42, depth * 0.3]} />
        <meshStandardMaterial color={bodyColor} metalness={0.7} roughness={0.22} />
      </mesh>

      {/* Lid hinged at the back edge. */}
      <group position={[0, thickness, -depth / 2]} rotation-x={-lidAngle}>
        <RoundedBox args={[width, lidH, 0.006]} radius={0.0028} smoothness={3} position={[0, lidH / 2, -0.003]} castShadow>
          <meshStandardMaterial color={bodyColor} metalness={0.85} roughness={0.32} />
        </RoundedBox>
        <mesh position={[0, lidH / 2, 0.0002]}>
          <planeGeometry args={[width * 0.985, lidH * 0.98]} />
          <meshStandardMaterial color="#050505" roughness={0.08} />
        </mesh>
        <mesh position={[0, lidH * 0.505, 0.0006]}>
          <planeGeometry args={[width * display[0], lidH * display[1]]} />
          <meshBasicMaterial map={screen} toneMapped={false} color={[glow, glow, glow]} />
        </mesh>
        {children}
      </group>
    </group>
  );
}
