import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { forceIntro, holdDoorOpen, initialShotOverride, useExperience } from './app/store';
import { useDocumentLocale } from './app/useContent';
import { Loader, type LoadStage } from './ui/Loader';
import { SceneErrorBoundary } from './ui/SceneErrorBoundary';
import { IntroCaption } from './ui/IntroCaption';
import { Hud } from './ui/Hud';
import { Fallback } from './ui/Fallback';
import { PortfolioSheet } from './ui/macbook/PortfolioSheet';
import { CareerSheet } from './ui/ipad/CareerSheet';
import { BookPanel } from './ui/bookshelf/BookPanel';
import { AutoSheet } from './ui/automotive/AutoSheet';
import { InteriorHint } from './ui/automotive/InteriorHint';

// three.js + R3F live in their own chunk; nothing 3D is downloaded for the fallback path.
const GarageCanvas = lazy(() => import('./scene/GarageCanvas'));


export function App() {
  useDocumentLocale();
  const tier = useExperience((s) => s.capabilities.tier);
  const webgl2 = useExperience((s) => s.capabilities.webgl2);
  const forceScene = useExperience((s) => s.forceScene);
  const forceFallback = useExperience((s) => s.forceFallback);
  const phase = useExperience((s) => s.phase);

  const [engineLoaded, setEngineLoaded] = useState(false);
  const [sceneProgress, setSceneProgress] = useState<number | null>(null);
  const [sceneFailed, setSceneFailed] = useState(false);

  const onReady = useCallback(() => {
    const s = useExperience.getState();
    if (initialShotOverride && !forceIntro) {
      useExperience.setState({ shot: initialShotOverride, phase: 'exploring', teslaDoorOpen: holdDoorOpen || initialShotOverride === 'teslaLaptop' || initialShotOverride === 'teslaInterior' });
    } else if (s.hasVisited && !forceIntro) {
      // Returning visitors skip the welcome sequence.
      useExperience.setState({ shot: 'overview', phase: 'exploring' });
    } else {
      useExperience.setState({ shot: 'macbookIntro', phase: 'intro' });
    }
  }, []);

  const show3D = (tier !== 'fallback' || forceScene) && !forceFallback;

  if (!show3D) return <Fallback canTry3D={webgl2} />;

  // Real stages only: engine chunk downloading → scene preparing (with genuine asset progress when available).
  const stage: LoadStage = !engineLoaded ? 'engine' : 'scene';

  return (
    <>
      <SceneErrorBoundary onFailed={() => setSceneFailed(true)}>
        <Suspense fallback={<EngineLoading />}>
          <EngineLoaded onLoaded={setEngineLoaded} />
          <GarageCanvas onProgress={setSceneProgress} onReady={onReady} />
        </Suspense>
      </SceneErrorBoundary>
      <IntroCaption />
      <Hud />
      <PortfolioSheet />
      <CareerSheet />
      <BookPanel />
      <AutoSheet />
      <InteriorHint />
      <Loader stage={stage} progress={engineLoaded ? sceneProgress : null} done={phase !== 'loading' || sceneFailed} />
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
