import { Html } from '@react-three/drei';
import { useExperience } from '@/app/store';
import { useNarrowViewport } from '@/lib/useViewport';
import { CareerApp } from '@/ui/ipad/CareerApp';
import { IPAD } from '../layout';

/** Career app canvas in CSS px — same aspect as the iPad's display area (265.6 × 199.5 mm). */
const PX_W = 1200;
/** drei <Html transform> maps 1 CSS px to 1/40 world unit (distanceFactor 10). */
const PX_TO_WORLD = 1 / 40;
const DISPLAY_W = IPAD.width - 0.016;

/**
 * Hosts the interactive career app on the iPad's 3D display (inside the iPad group, lying flat).
 * Same approach as the MacBook: mounted when the camera has arrived; sheet on phones/portrait.
 */
export function IPadScreen() {
  const visible = useExperience((s) => s.shot === 'ipad' && s.arrivedShot === 'ipad' && s.phase === 'exploring');
  const narrow = useNarrowViewport();
  if (!visible || narrow) return null;
  return (
    <Html
      transform
      position={[0, IPAD.thickness + 0.0008, 0]}
      rotation-x={-Math.PI / 2}
      scale={DISPLAY_W / (PX_W * PX_TO_WORLD)}
      zIndexRange={[25, 21]}
    >
      <CareerApp mode="screen" />
    </Html>
  );
}
