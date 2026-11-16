import { RoundedBox } from '@react-three/drei';
import { STUDIO_DISPLAY } from '../layout';
import { useScreenTexture } from '../screens/screenTextures';
import { mat } from '../materials/library';



/**
 * PROVISIONAL Apple Studio Display (27"), silver, on the tilt-adjustable stand.
 * Real proportions; uniform black bezel; screen shows a quiet, dark Xcode-like editor so it
 * frames the MacBook without competing with it. Final asset: licensed/custom model.
 */
export function StudioDisplay() {
  const screen = useScreenTexture('xcode');
  const { position, width: W, height: H, depth: D, lift, tilt } = STUDIO_DISPLAY;
  const footDepth = 0.168;
  const standW = 0.15;
  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Foot: a flat aluminium plate under the display. */}
      <RoundedBox args={[standW, 0.006, footDepth]} radius={0.002} position={[0, 0.003, -0.02]} castShadow receiveShadow>
        <primitive object={mat.aluminium('#c9cbce', 1)} attach="material" />
      </RoundedBox>
      {/* Arm: rises from the back of the foot to the hinge behind the display. */}
      <group position={[0, 0.005, -0.1]} rotation-x={-0.16}>
        <RoundedBox args={[standW, 0.3, 0.006]} radius={0.002} position-y={0.15} castShadow>
          <primitive object={mat.aluminium('#c9cbce', 1)} attach="material" />
        </RoundedBox>
      </group>
      {/* Display enclosure, tilted back slightly around its lower edge. */}
      <group position={[0, lift, 0]} rotation-x={-tilt}>
        <RoundedBox args={[W, H, D]} radius={0.006} smoothness={4} position={[0, H / 2, -D / 2]} castShadow>
          <primitive object={mat.aluminium('#c9cbce', 1)} attach="material" />
        </RoundedBox>
        {/* Front glass with uniform black border. */}
        <mesh position={[0, H / 2, 0.0006]}>
          <planeGeometry args={[W - 0.004, H - 0.004]} />
          <meshStandardMaterial color="#030303" roughness={0.05} metalness={0.1} />
        </mesh>
        {/* 5K panel: 596.7 × 335.7 mm active area. Kept dimmer than the MacBook. */}
        <mesh position={[0, H / 2, 0.0011]}>
          <planeGeometry args={[0.5967, 0.3357]} />
          <meshBasicMaterial map={screen} toneMapped={false} color={[0.82, 0.82, 0.82]} />
        </mesh>
        {/* Reflection-only glass over the panel (screen content untouched). */}
        <mesh position={[0, H / 2, 0.0016]} material={mat.screenGlass()}>
          <planeGeometry args={[W - 0.004, H - 0.004]} />
        </mesh>
        {/* Faint cool spill from the panel onto the desk. */}
        <rectAreaLight position={[0, H / 2, 0.02]} rotation={[0, Math.PI, 0]} width={0.58} height={0.32} intensity={0.9} color="#c9d6ff" />
        {/* Camera. */}
        <mesh position={[0, H - 0.0065, 0.0012]}>
          <circleGeometry args={[0.0018, 12]} />
          <meshBasicMaterial color="#111" />
        </mesh>
      </group>
    </group>
  );
}
