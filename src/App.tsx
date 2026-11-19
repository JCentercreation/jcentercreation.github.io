import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { SHOT_IDS, forceIntro, holdDoorOpen, initialShotOverride, useExperience } from './app/store';
import { RESUME_KEY, RenderNotice } from './ui/RenderNotice';
import type { ShotId } from './content';
import { useDocumentLocale } from './app/useContent';
import { Loader, type LoadStage } from './ui/Loader';
import { SceneErrorBoundary } from './ui/SceneErrorBoundary';
import { IntroCaption } from './ui/IntroCaption';
import { Hud } from './ui/Hud';
import { prefetchScreens } from './ui/screens';
import { PortfolioSheet } from './ui/macbook/PortfolioSheet';
import { CareerSheet } from './ui/ipad/CareerSheet';
import { BookPanel } from './ui/bookshelf/BookPanel';
import { AutoSheet } from './ui/automotive/AutoSheet';
import { InteriorHint } from './ui/automotive/InteriorHint';

// three.js + R3F live in their own chunk; nothing 3D is downloaded for the fallback path.
const GarageCanvas = lazy(() => import('./scene/GarageCanvas'));
// The simple version is its own small chunk: only visitors who see it download it.
const Fallback = lazy(() => import('./ui/Fallback').then((m) => ({ default: m.Fallback })));


export function App() {
  useDocumentLocale();
  const tier = useExperience((s) => s.capabilities.tier);
  const webgl2 = useExperience((s) => s.capabilities.webgl2);
  const forceScene = useExperience((s) => s.forceScene);
  const forceFallback = useExperience((s) => s.forceFallback);
  const phase = useExperience((s) => s.phase);
  // Once the MacBook's first frame has rendered, the loading screen lives on its display.
  const bootVisible = useExperience((s) => s.boot.step >= 1);

  const [engineLoaded, setEngineLoaded] = useState(false);
  const [sceneProgress, setSceneProgress] = useState<number | null>(null);
  const [sceneFailed, setSceneFailed] = useState(false);

  // Called once the garage is genuinely ready (every boot milestone done, scene/boot.ts). The camera has
  // been at the MacBook close-up throughout; `entry` tells it how to leave (CameraController).
  const onReady = useCallback(() => {
    const s = useExperience.getState();
    // After a visitor-requested reload (RenderNotice), return to the place they were at.
    let resume: string | null = null;
    try {
      resume = sessionStorage.getItem(RESUME_KEY);
      sessionStorage.removeItem(RESUME_KEY);
    } catch {
      // storage unavailable: start as usual
    }
    if (resume && SHOT_IDS.includes(resume as ShotId) && resume !== 'macbookIntro') {
      const shot = resume as ShotId;
      useExperience.setState({ shot, phase: 'exploring', entry: 'return', teslaDoorOpen: shot === 'teslaInterior' || shot === 'teslaLaptop' });
      return;
    }
    if (initialShotOverride && !forceIntro) {
      useExperience.setState({ shot: initialShotOverride, phase: 'exploring', entry: 'override', teslaDoorOpen: holdDoorOpen || initialShotOverride === 'teslaLaptop' || initialShotOverride === 'teslaInterior' });
    } else if (s.skipIntroRequested) {
      // Skipped while loading: arrive at the overview directly, interactive at once.
      s.markVisited();
      useExperience.setState({ shot: 'overview', phase: 'exploring', entry: 'skip', skipIntroRequested: false });
    } else if (s.hasVisited && !forceIntro) {
      // Returning visitors: no welcome sequence, a short move from the MacBook to the overview.
      useExperience.setState({ shot: 'overview', phase: 'exploring', entry: 'return' });
    } else {
      useExperience.setState({ shot: 'macbookIntro', phase: 'intro', entry: 'intro' });
    }
  }, []);

  const show3D = (tier !== 'fallback' || forceScene) && !forceFallback;

  // Once loading is over (the garage is usable), fetch the device screen UIs while the browser is idle.
  useEffect(() => {
    if (phase !== 'loading') prefetchScreens();
  }, [phase]);

  if (!show3D)
    return (
      <Suspense fallback={null}>
        <Fallback canTry3D={webgl2} />
      </Suspense>
    );

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
      <RenderNotice />
      {/* On failure the error panel takes the loader's place outright — no cross-fade of two titles. */}
      {!sceneFailed && <Loader stage={stage} progress={engineLoaded ? sceneProgress : null} done={phase !== 'loading' || bootVisible} />}
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
