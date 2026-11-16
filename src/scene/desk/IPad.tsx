import { RoundedBox } from '@react-three/drei';
import { useExperience } from '@/app/store';
import { IPAD } from '../layout';
import { Interactive, useIsHovered } from '../Interactive';
import { useScreenTexture } from '../screens/screenTextures';
import { IPadScreen } from './IPadScreen';
import { mat } from '../materials/library';

/** iPad Pro 13", flat on the desk in landscape, screen on. Click → camera above, near-perpendicular. */
export function IPad() {
  const screen = useScreenTexture('ipad');
  const hovered = useIsHovered('ipad');
  const shot = useExperience((s) => s.shot);
  const glow = hovered ? 1.25 : 1.0;
  return (
    <Interactive id="ipad" enabled={shot !== 'ipad'} onSelect={() => useExperience.getState().goTo('ipad')}>
      <group position={IPAD.position} rotation-y={IPAD.rotationY}>
        <RoundedBox args={[IPAD.width, IPAD.thickness, IPAD.depth]} radius={0.0024} smoothness={3} position-y={IPAD.thickness / 2} castShadow receiveShadow>
<primitive object={mat.aluminium('#3a3b3e', 1)} attach="material" />
        </RoundedBox>
        <mesh position-y={IPAD.thickness + 0.0002} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[IPAD.width - 0.004, IPAD.depth - 0.004]} />
          <meshStandardMaterial color="#030303" roughness={0.06} />
        </mesh>
        <mesh position-y={IPAD.thickness + 0.0005} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[IPAD.width - 0.016, IPAD.depth - 0.016]} />
          <meshBasicMaterial map={screen} toneMapped={false} color={[glow, glow, glow]} />
        </mesh>
        <mesh position-y={IPAD.thickness + 0.0008} rotation-x={-Math.PI / 2} material={mat.screenGlass()}>
          <planeGeometry args={[IPAD.width - 0.004, IPAD.depth - 0.004]} />
        </mesh>
        {/* Interactive career app, mapped onto the display once the camera arrives. */}
        <IPadScreen />
      </group>
      {/* Apple Pencil resting along the front edge. */}
      <mesh position={[IPAD.position.x + 0.01, IPAD.position.y + 0.0045, IPAD.position.z + 0.15]} rotation={[0, IPAD.rotationY + 0.08, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.0044, 0.0044, 0.166, 16]} />
        <meshStandardMaterial color="#f2f2f0" roughness={0.35} />
      </mesh>
    </Interactive>
  );
}
