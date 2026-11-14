import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils, type PerspectiveCamera, Vector3 } from 'three';
import gsap from 'gsap';
import type { ShotId } from '@/content';
import { useExperience } from '@/app/store';
import { SHOTS } from '../layout';
import { responsiveFov } from './fov';

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

  /** Animate the rig to a shot. Resolves when it arrives. */
  const flyTo = (id: ShotId, opts: { duration?: number; ease?: string; delay?: number; onComplete?: () => void } = {}) => {
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
    tween.current = gsap.to(p, {
      t: 1,
      duration,
      delay: opts.delay ?? 0,
      ease: opts.ease ?? 'power3.inOut',
      onUpdate: () => {
        r.pos.lerpVectors(fromPos, shot.position, p.t);
        r.pos.y += Math.sin(Math.PI * p.t) * lift;
        r.target.lerpVectors(fromTarget, shot.target, p.t);
        r.fov = MathUtils.lerp(fromFov, shot.fov, p.t);
        r.parallax = MathUtils.lerp(fromPar, shot.parallax ? 1 : 0, p.t);
      },
      onComplete: opts.onComplete,
    });
  };

  // Phase / shot changes drive the camera.
  useEffect(() => {
    const finishIntro = () => {
      const s = useExperience.getState();
      s.markVisited();
      useExperience.setState({ phase: 'exploring', shot: 'overview', skipIntroRequested: false });
    };

    return useExperience.subscribe((state, prev) => {
      // First frame after loading: snap to the starting shot.
      if (prev.phase === 'loading' && state.phase !== 'loading') {
        const start = SHOTS[state.shot];
        rig.current = { pos: start.position.clone(), target: start.target.clone(), fov: start.fov, parallax: start.parallax ? 1 : 0 };
        if (state.phase === 'intro') {
          // Welcome sequence: hold on the note, then a slow pull-back revealing the garage (~6 s total).
          const reduced = state.reducedMotion;
          flyTo('overview', {
            delay: reduced ? 1.2 : 2.4,
            duration: reduced ? 1.2 : 4.4,
            ease: 'power2.inOut',
            onComplete: finishIntro,
          });
        }
        return;
      }
      if (state.phase === 'intro' && state.skipIntroRequested && !prev.skipIntroRequested) {
        flyTo('overview', { duration: 1.0, ease: 'power2.out', onComplete: finishIntro });
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
    camera.lookAt(r.target);

    const fov = responsiveFov(r.fov, state.size.width / state.size.height);
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
