import { useExperience } from '@/app/store';
import { useNarrowViewport } from '@/lib/useViewport';
import { AutoPortfolio } from './AutoPortfolio';

/** Phones / portrait: the automotive portfolio opens full-screen once the camera reaches the laptop. */
export function AutoSheet() {
  const visible = useExperience((s) => s.shot === 'teslaLaptop' && s.arrivedShot === 'teslaLaptop' && s.phase === 'exploring');
  const narrow = useNarrowViewport();
  if (!visible || !narrow) return null;
  return <AutoPortfolio mode="sheet" />;
}
