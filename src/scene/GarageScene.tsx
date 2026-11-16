import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useExperience } from '@/app/store';
import { BOOT_STEPS } from './boot';
import { CameraController } from './camera/CameraController';
import { ShadowUpdater } from './shadows';
import { GroundContact } from './environment/GroundContact';
import { Effects } from './Effects';
import { Lighting } from './Lighting';
import { Bookshelf } from './bookshelf/Bookshelf';
import { RunningShoes } from './decor/RunningShoes';
import { FramedPhoto } from './decor/FramedPhoto';
import { DeskArea } from './desk/DeskArea';
import { MacBook } from './desk/MacBook';
import { Outside } from './environment/Outside';
import { Room } from './environment/Room';
import { StormController } from './environment/storm';
import { WindowGlass } from './environment/WindowGlass';
import { Tesla } from './tesla/Tesla';
import { Workshop } from './tesla/Workshop';
import { DESK_OFFSET } from './layout';

/** Two animation frames: enough for R3F to render what was just committed. */
function afterFrames(cb: () => void) {
  let a = 0;
  let b = 0;
  a = requestAnimationFrame(() => {
    b = requestAnimationFrame(cb);
  });
  return () => {
    cancelAnimationFrame(a);
    cancelAnimationFrame(b);
  };
}

/** Rendered inside a stage: reports once that stage has been committed and drawn. */
function StageMark({ index, onRendered }: { index: number; onRendered: (i: number) => void }) {
  useEffect(() => afterFrames(() => onRendered(index)), [index, onRendered]);
  return null;
}

/**
 * The Engineer's Garage. Each area is an independent module positioned from layout.ts, so any
 * provisional model can be swapped for a final GLB without touching the others.
 *
 * Staged mounting (the loading sequence on the MacBook — scene/boot.ts): the MacBook mounts first so
 * its display can show progress within a frame or two of the engine arriving; then the room, the
 * workspace, the library, the car and the storm/finishing touches mount one after another. Each
 * stage is a real milestone: it completes once its content (and its procedural textures) has been
 * committed and rendered, and the next stage only starts after the MacBook has repainted the new
 * progress — so the visitor sees genuine progress between the heavy steps. Every later stage has its
 * own Suspense boundary, so nothing can blank out the MacBook while it loads.
 */
export function GarageScene() {
  const full = useExperience((s) => s.capabilities.tier === 'full');
  const [stage, setStage] = useState(0);
  const completed = useRef(-1);

  const onRendered = useCallback((i: number) => {
    if (i <= completed.current) return;
    completed.current = i;
    // Milestone i done → show the next one on the MacBook, let it paint, then mount the next stage.
    useExperience.getState().setBoot(i + 1, BOOT_STEPS[i + 1] ?? null);
    afterFrames(() => setStage((s) => Math.max(s, i + 1)));
  }, []);

  return (
    <>
      <color attach="background" args={['#020305']} />
      <fog attach="fog" args={['#050608', 7, 22]} />
      <StormController />
      <Lighting />
      <ShadowUpdater />
      <CameraController />

      {/* Stage 0 — the MacBook (same transform as inside DeskArea), showing the loading screen. */}
      <group position={DESK_OFFSET}>
        <MacBook />
      </group>
      <StageMark index={0} onRendered={onRendered} />

      {stage >= 1 && (
        <Suspense fallback={null}>
          <Room />
          <StageMark index={1} onRendered={onRendered} />
        </Suspense>
      )}
      {stage >= 2 && (
        <Suspense fallback={null}>
          <DeskArea withMacBook={false} />
          <FramedPhoto />
          <RunningShoes />
          <StageMark index={2} onRendered={onRendered} />
        </Suspense>
      )}
      {stage >= 3 && (
        <Suspense fallback={null}>
          <Bookshelf />
          <StageMark index={3} onRendered={onRendered} />
        </Suspense>
      )}
      {stage >= 4 && (
        <Suspense fallback={null}>
          <Tesla />
          <Workshop />
          <StageMark index={4} onRendered={onRendered} />
        </Suspense>
      )}
      {stage >= 5 && (
        <Suspense fallback={null}>
          <Outside />
          <WindowGlass />
          {/* Contact shadows render once: mounted last, after everything they ground. */}
          <GroundContact />
          {full && <Effects />}
          <StageMark index={5} onRendered={onRendered} />
        </Suspense>
      )}
    </>
  );
}
