import { useEffect, useState } from 'react';

/**
 * Phones and portrait screens can't show the MacBook's screen large enough in 3D, so screen
 * interfaces open as a full-screen sheet there instead.
 */
export function isNarrowViewport() {
  return window.innerWidth < 900 || window.innerHeight > window.innerWidth;
}

export function useNarrowViewport() {
  const [narrow, setNarrow] = useState(isNarrowViewport);
  useEffect(() => {
    const onResize = () => setNarrow(isNarrowViewport());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return narrow;
}
