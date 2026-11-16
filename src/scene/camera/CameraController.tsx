import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils, type PerspectiveCamera, Vector3 } from 'three';
import gsap from 'gsap';
import type { ShotId } from '@/content';
import { cameraOverride, useExperience } from '@/app/store';
import { MACBOOK_LID_TOP_FROM_CENTRE, SHOTS } from '../layout';
import { fitDistanceFactor, landscapeFitFactor, responsiveFov } from './fov';

// Review tooling only: `?capture=1` exposes the animation clock so a recorder can step the
// welcome sequence frame by frame (software-rendered review captures can't run in real time).
if (new URLSearchParams(window.location.search).has('capture')) {
  (window as unknown as { __gsap: typeof gsap; __shots: typeof SHOTS }).__gsap = gsap;
  (window as unknown as { __shots: typeof SHOTS }).__shots = SHOTS;
}

interface Rig {
  pos: Vector3;
  target: Vector3;
  fov: number;
  parallax: number;
}

/**
 * The only thing that moves the camera. Fixed cinematic shots (layout.ts) with eased
 * transitions; no free camera. A gentle arc lifts long moves so they never skim furniture.
 */
export function CameraController() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const rig = useRef<Rig | null>(null);
  const tween = useRef<gsap.core.Tween | gsap.core.Timeline | null>(null);
  const pointer = useRef({ x: 0, y: 0, sx: 0, sy: 0 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  // From the very first frame the camera sits at the starting shot (the MacBook close-up), so the
  // loading screen on its display is visible while the rest of the garage loads.
  if (!rig.current) {
    const start = SHOTS[useExperience.getState().shot];
    rig.current = { pos: start.position.clone(), target: start.target.clone(), fov: start.fov, parallax: start.parallax ? 1 : 0 };
  }

  /** Animate the rig to a shot. Resolves when it arrives. */
  const flyTo = (id: ShotId, opts: { duration?: number; ease?: string; delay?: number; onStart?: () => void; onComplete?: () => void } = {}) => {
    const r = rig.current;
    if (!r) return;
    const shot = SHOTS[id];
    const fromPos = r.pos.clone();
    const fromTarget = r.target.clone();
    const fromFov = r.fov;
    const fromPar = r.parallax;
    const dist = fromPos.distanceTo(shot.position);
    const reduced = useExperience.getState().reducedMotion;
    const duration = opts.duration ?? (reduced ? 0.45 : MathUtils.clamp(1.15 + dist * 0.2, 1.2, 2.6));
    const lift = reduced ? 0 : Math.min(0.35, dist * 0.05);
    const p = { t: 0 };
    tween.current?.kill();
    useExperience.getState().setArrivedShot(null);
    const done = opts.onComplete;
    tween.current = gsap.to(p, {
      t: 1,
      duration,
      delay: opts.delay ?? 0,
      ease: opts.ease ?? 'power3.inOut',
      onStart: opts.onStart,
      onUpdate: () => {
        r.pos.lerpVectors(fromPos, shot.position, p.t);
        r.pos.y += Math.sin(Math.PI * p.t) * lift;
        r.target.lerpVectors(fromTarget, shot.target, p.t);
        r.fov = MathUtils.lerp(fromFov, shot.fov, p.t);
        r.parallax = MathUtils.lerp(fromPar, shot.parallax ? 1 : 0, p.t);
      },
      onComplete: () => {
        useExperience.getState().setArrivedShot(id);
        done?.();
      },
    });
  };

  // Phase / shot changes drive the camera.
  useEffect(() => {
    const finishIntro = () => {
      const s = useExperience.getState();
      s.markVisited();
      useExperience.setState({ phase: 'exploring', shot: 'overview', skipIntroRequested: false, introRevealing: false });
    };

    return useExperience.subscribe((state, prev) => {
      // Loading finished: the camera starts at the MacBook close-up (set at mount) and leaves it
      // according to how the visitor entered (App.tsx onReady → state.entry).
      if (prev.phase === 'loading' && state.phase !== 'loading') {
        if (cameraOverride) {
          rig.current = { pos: new Vector3(...cameraOverride.position), target: new Vector3(...cameraOverride.target), fov: cameraOverride.fov, parallax: 0 };
          useExperience.getState().setArrivedShot(state.shot);
          return;
        }
        const reduced = state.reducedMotion;
        if (state.entry === 'intro') {
          // First visit: the welcome note replaces the loading screen on the MacBook, a short hold to read
          // it, then the slow pull-back revealing the garage (~6.7 s incl. the "Ready" confirmation).
          // Reduced motion: the same hold, then a cut instead of a camera flight.
          flyTo('overview', {
            delay: reduced ? 3 : 1.8,
            duration: reduced ? 0.01 : 4.4,
            ease: 'power2.inOut',
            onStart: () => useExperience.setState({ introRevealing: true }),
            onComplete: finishIntro,
          });
          return;
        }
        if (state.entry === 'return') {
          // Returning visitor: no welcome sequence — a brief, smooth move from the MacBook to the overview.
          flyTo(state.shot, { duration: reduced ? 0.01 : 1.6, ease: 'power2.inOut' });
          return;
        }
        // Skipped while loading, or a review ?shot= override: arrive directly (no unexpected movement).
        const start = SHOTS[state.shot];
        tween.current?.kill();
        rig.current = { pos: start.position.clone(), target: start.target.clone(), fov: start.fov, parallax: start.parallax ? 1 : 0 };
        useExperience.getState().setArrivedShot(state.shot);
        return;
      }
      if (state.phase === 'intro' && state.skipIntroRequested && !prev.skipIntroRequested) {
        // Skip: settle quickly (or cut, with reduced motion); the scene is interactive on arrival.
        flyTo('overview', { duration: state.reducedMotion ? 0.01 : 0.9, ease: 'power2.out', onComplete: finishIntro });
        return;
      }
      if (state.phase === 'exploring' && state.shot !== prev.shot && prev.phase === 'exploring') {
        flyTo(state.shot);
      }
    });
    // flyTo only touches refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => void tween.current?.kill(), []);

  const offset = useRef(new Vector3());
  const right = useRef(new Vector3());
  useFrame((state, dt) => {
    const r = rig.current;
    if (!r) return;
    const pt = pointer.current;
    const k = Math.min(1, dt * 2.5);
    const allow = useExperience.getState().reducedMotion ? 0 : r.parallax;
    pt.sx += (pt.x * allow - pt.sx) * k;
    pt.sy += (pt.y * allow - pt.sy) * k;

    // Parallax: a few centimetres sideways/up, so the room feels physical.
    right.current.subVectors(r.target, r.pos).cross(camera.up).normalize();
    offset.current.copy(right.current).multiplyScalar(pt.sx * 0.09);
    offset.current.y += -pt.sy * 0.045;
    camera.position.copy(r.pos).add(offset.current);
    // MacBook close-up on phones: in portrait the FOV cap can't keep the display's full width in frame; in
    // landscape the short viewport crops the lid's top bezel. Move back along the view direction just enough
    // to fit it (landscape: the whole lid with a small margin). Fades out within the first 60 cm of the
    // pull-back, so the transition and every other shot keep their approved framing.
    const intro = SHOTS.macbookIntro;
    const w = 1 - MathUtils.smoothstep(r.pos.distanceTo(intro.position), 0, 0.6);
    if (w > 0) {
      const aspect = state.size.width / state.size.height;
      const k = Math.max(
        fitDistanceFactor(intro.fov, aspect),
        landscapeFitFactor(intro.fov, intro.position.distanceTo(intro.target), MACBOOK_LID_TOP_FROM_CENTRE, aspect, state.size.height),
      );
      if (k > 1) camera.position.sub(r.target).multiplyScalar(1 + (k - 1) * w).add(r.target);
    }
    camera.lookAt(r.target);

    const fov = responsiveFov(r.fov, state.size.width / state.size.height);
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
