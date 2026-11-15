import { useExperience } from '@/app/store';
import { useNarrowViewport } from '@/lib/useViewport';
import { Portfolio } from './Portfolio';

/** Phones / portrait screens: the MacBook portfolio opens full-screen once the camera arrives. */
export function PortfolioSheet() {
  const visible = useExperience((s) => s.shot === 'macbook' && s.arrivedShot === 'macbook' && s.phase === 'exploring');
  const narrow = useNarrowViewport();
  if (!visible || !narrow) return null;
  return <Portfolio mode="sheet" />;
}
