import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { forceIntro, holdDoorOpen, initialShotOverride, useExperience } from './app/store';
import { useDocumentLocale } from './app/useContent';
import { Loader } from './ui/Loader';
import { Hud } from './ui/Hud';
import { Fallback } from './ui/Fallback';
import { PortfolioSheet } from './ui/macbook/PortfolioSheet';
import { CareerSheet } from './ui/ipad/CareerSheet';
import { BookPanel } from './ui/bookshelf/BookPanel';

// three.js + R3F live in their own chunk; nothing 3D is downloaded for the fallback path.
const GarageCanvas = lazy(() => import('./scene/GarageCanvas'));

/** Share of the progress bar reserved for downloading the 3D engine chunk itself. */
const ENGINE_SHARE = 20;

export function App() {
  useDocumentLocale();
  const tier = useExperience((s) => s.capabilities.tier);
  const webgl2 = useExperience((s) => s.capabilities.webgl2);
  const forceScene = useExperience((s) => s.forceScene);
  const phase = useExperience((s) => s.phase);

  const [engineLoaded, setEngineLoaded] = useState(false);
  const [sceneProgress, setSceneProgress] = useState(0);

  const onReady = useCallback(() => {
    const s = useExperience.getState();
    if (initialShotOverride && !forceIntro) {
      useExperience.setState({ shot: initialShotOverride, phase: 'exploring', teslaDoorOpen: holdDoorOpen || initialShotOverride === 'teslaLaptop' });
    } else if (s.hasVisited && !forceIntro) {
      // Returning visitors skip the welcome sequence.
      useExperience.setState({ shot: 'overview', phase: 'exploring' });
    } else {
      useExperience.setState({ shot: 'macbookIntro', phase: 'intro' });
    }
  }, []);

  const show3D = tier !== 'fallback' || forceScene;

  if (!show3D) return <Fallback canTry3D={webgl2} />;

  const progress = engineLoaded ? ENGINE_SHARE + (sceneProgress * (100 - ENGINE_SHARE)) / 100 : 8;

  return (
    <>
      <Suspense fallback={<EngineLoading />}>
        <EngineLoaded onLoaded={setEngineLoaded} />
        <GarageCanvas onProgress={setSceneProgress} onReady={onReady} />
      </Suspense>
      <Hud />
      <PortfolioSheet />
      <CareerSheet />
      <BookPanel />
      <Loader progress={progress} done={phase !== 'loading'} />
    </>
  );
}

function EngineLoading() {
  return null;
}

/** Rendered alongside the lazy canvas, so it mounts exactly when the engine chunk has arrived. */
function EngineLoaded({ onLoaded }: { onLoaded: (v: boolean) => void }) {
  useEffect(() => onLoaded(true), [onLoaded]);
  return null;
}
