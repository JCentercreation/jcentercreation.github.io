import { Html } from '@react-three/drei';
import { useExperience } from '@/app/store';
import { useNarrowViewport } from '@/lib/useViewport';
import { Portfolio } from '@/ui/macbook/Portfolio';
import { MACBOOK } from '../layout';

/** Portfolio canvas size in CSS px — same aspect as the MacBook's display area. */
const PX_W = 1280;
/** drei <Html transform> maps 1 CSS px to 1/40 world unit (distanceFactor 10). */
const PX_TO_WORLD = 1 / 40;

/**
 * Hosts the interactive portfolio on the MacBook's 3D screen. Lives inside the lid group, so it
 * follows the lid exactly. Mounted only once the camera has arrived on the MacBook (desktop);
 * phones and portrait screens get the full-screen sheet instead (see App).
 */
export function MacBookScreen({ lidHeight, displayWidth }: { lidHeight: number; displayWidth: number }) {
  const visible = useExperience((s) => s.shot === 'macbook' && s.arrivedShot === 'macbook' && s.phase === 'exploring');
  const narrow = useNarrowViewport();
  if (!visible || narrow) return null;
  const scale = (MACBOOK.width * displayWidth) / (PX_W * PX_TO_WORLD);
  return (
    <Html transform position={[0, lidHeight * 0.505, 0.0015]} scale={scale} zIndexRange={[25, 21]}>
      <Portfolio mode="screen" />
    </Html>
  );
}
