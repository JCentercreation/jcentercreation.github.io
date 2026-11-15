import { useExperience } from '@/app/store';
import { useNarrowViewport } from '@/lib/useViewport';
import { CareerApp } from './CareerApp';

/** Phones / portrait screens: the iPad experience opens full-screen once the camera arrives. */
export function CareerSheet() {
  const visible = useExperience((s) => s.shot === 'ipad' && s.arrivedShot === 'ipad' && s.phase === 'exploring');
  const narrow = useNarrowViewport();
  if (!visible || !narrow) return null;
  return <CareerApp mode="sheet" />;
}
