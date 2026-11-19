import { lazy, Suspense, type ComponentProps } from 'react';

/**
 * The interactive screen UIs (MacBook portfolio, iPad career app, automotive portfolio) are only needed once
 * the visitor reaches a device, so they load as separate chunks instead of with the first page. Both the 3D
 * screens and the phone sheets use these, so each UI downloads once. prefetchScreens() fetches them while the
 * browser is idle after the garage becomes usable, so opening a device does not wait for the network.
 */
const loadPortfolio = () => import('./macbook/Portfolio');
const loadCareer = () => import('./ipad/CareerApp');
const loadAuto = () => import('./automotive/AutoPortfolio');

const PortfolioUI = lazy(() => loadPortfolio().then((m) => ({ default: m.Portfolio })));
const CareerUI = lazy(() => loadCareer().then((m) => ({ default: m.CareerApp })));
const AutoUI = lazy(() => loadAuto().then((m) => ({ default: m.AutoPortfolio })));

type Mode = { mode: 'screen' | 'sheet' };

export function LazyPortfolio(props: ComponentProps<typeof PortfolioUI> & Mode) {
  return (
    <Suspense fallback={null}>
      <PortfolioUI {...props} />
    </Suspense>
  );
}

export function LazyCareerApp(props: ComponentProps<typeof CareerUI> & Mode) {
  return (
    <Suspense fallback={null}>
      <CareerUI {...props} />
    </Suspense>
  );
}

export function LazyAutoPortfolio(props: ComponentProps<typeof AutoUI> & Mode) {
  return (
    <Suspense fallback={null}>
      <AutoUI {...props} />
    </Suspense>
  );
}

let prefetched = false;
/** Fetches the screen UIs once, while the browser is idle. */
export function prefetchScreens() {
  if (prefetched) return;
  prefetched = true;
  const run = () => {
    void loadPortfolio();
    void loadCareer();
    void loadAuto();
  };
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
  if (idle) idle(run, { timeout: 3000 });
  else window.setTimeout(run, 1000);
}
