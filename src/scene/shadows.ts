import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { Object3D } from 'three';
import { useExperience } from '@/app/store';

/**
 * Static shadow maps (full tier). Almost nothing in the garage moves, so the two shadow maps are
 * rendered only when something that casts a shadow changes, instead of every frame:
 * - moving objects call markShadowsDirty() while they move (catalogue books, the driver's door);
 * - any navigation / selection / door state change re-renders them for a few frames (insurance);
 * - a cheap periodic check re-renders them if the set of visible shadow casters changes (an object
 *   mounted, unmounted or was hidden).
 * Lightning only changes light intensity, which never needs a shadow-map re-render.
 */
let dirtyFrames = 4;
let renders = 0;

export function markShadowsDirty(frames = 2) {
  dirtyFrames = Math.max(dirtyFrames, frames);
}

const capture = new URLSearchParams(window.location.search).has('capture');
if (capture) (window as unknown as { __shadows: { renders: () => number } }).__shadows = { renders: () => renders };

function casterSignature(root: Object3D) {
  let n = 0;
  let sum = 0;
  root.traverseVisible((o) => {
    if (o.castShadow && (o as { isMesh?: boolean }).isMesh) {
      n++;
      sum += o.id;
    }
  });
  return `${n}:${sum}`;
}

export function ShadowUpdater() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);

  useEffect(
    () =>
      useExperience.subscribe((s, p) => {
        if (s.shot !== p.shot || s.arrivedShot !== p.arrivedShot || s.selectedBook !== p.selectedBook || s.teslaDoorOpen !== p.teslaDoorOpen || s.phase !== p.phase)
          markShadowsDirty(3);
      }),
    [],
  );

  const frame = useRef(0);
  const signature = useRef('');
  useFrame(() => {
    if (!gl.shadowMap.enabled) return;
    if (++frame.current % 30 === 0) {
      const sig = casterSignature(scene);
      if (sig !== signature.current) {
        signature.current = sig;
        markShadowsDirty(2);
      }
    }
    if (dirtyFrames > 0) {
      gl.shadowMap.needsUpdate = true;
      dirtyFrames--;
      renders++;
    }
  });
  return null;
}
