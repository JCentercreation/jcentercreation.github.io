import { Html } from '@react-three/drei';
import { useExperience } from '@/app/store';
import { useNarrowViewport } from '@/lib/useViewport';
import { AutoPortfolio } from '@/ui/automotive/AutoPortfolio';

/** Portfolio canvas in CSS px — same aspect as the laptop's display area. */
export const CAR_LAPTOP = { width: 0.34, depth: 0.235, display: [0.94, 0.88] as const };
const PX_W = 1280;
const PX_TO_WORLD = 1 / 40; // drei <Html transform>, distanceFactor 10

/**
 * Hosts the automotive portfolio on the laptop's 3D screen (inside the lid group) once the camera
 * has arrived at the laptop; phones/portrait get the full-screen sheet instead.
 */
export function CarLaptopScreen() {
  const visible = useExperience((s) => s.shot === 'teslaLaptop' && s.arrivedShot === 'teslaLaptop' && s.phase === 'exploring');
  const narrow = useNarrowViewport();
  if (!visible || narrow) return null;
  const lidH = CAR_LAPTOP.depth * 0.985;
  return (
    <Html transform position={[0, lidH * 0.505, 0.0015]} scale={(CAR_LAPTOP.width * CAR_LAPTOP.display[0]) / (PX_W * PX_TO_WORLD)} zIndexRange={[25, 21]}>
      <AutoPortfolio mode="screen" />
    </Html>
  );
}
