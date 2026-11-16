import { Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { useProgress } from '@react-three/drei';
import { HalfFloatType, PCFShadowMap, SRGBColorSpace, WebGLRenderTarget } from 'three';
import { useExperience } from '@/app/store';
import { useNarrowViewport } from '@/lib/useViewport';
import { GarageScene } from './GarageScene';
import { BOOT_STEPS, SCENE_STAGES } from './boot';
import { EXPOSURE, RENDERER_TONE_MAPPING, TONE_MAPPING } from './renderConfig';
import { captureRoomEnvironment, seedEnvironment } from './environment/roomEnvironment';

interface Props {
  /** Real asset progress, or null when the loading manager has nothing in flight. */
  onProgress: (pct: number | null) => void;
  onReady: () => void;
}

const capture = new URLSearchParams(window.location.search).has('capture');

/** Bridges drei's loading manager progress out to the DOM loader. */
function ProgressReporter({ onProgress }: Pick<Props, 'onProgress'>) {
  const { progress, active } = useProgress();
  useEffect(() => {
    onProgress(active ? progress : null);
  }, [progress, active, onProgress]);
  return null;
}

function nextFrames(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}

/** Brief visual confirmation of "Ready" on the MacBook before the welcome continues (not a fake wait: loading is done). */
const READY_CONFIRM_MS = 500;

/**
 * The last two boot milestones (scene/boot.ts), once every scene stage has rendered:
 * 1. materials — seed the reflections, then compile every shader variant (on-screen, and the
 *    off-screen variants the room capture renders with) asynchronously, so nothing compiles mid-reveal;
 * 2. reflections — capture the room once.
 * Each milestone is shown on the MacBook and painted before the next (synchronous) step runs. A
 * compile or capture failure never blocks the visitor: the scene is still complete without them.
 */
function ReadySignal({ onReady, envResolution }: Pick<Props, 'onReady'> & { envResolution: number }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const sceneMounted = useExperience((s) => s.boot.step >= SCENE_STAGES);
  useEffect(() => {
    if (!sceneMounted) return;
    let cancelled = false;
    const { setBoot } = useExperience.getState();
    void (async () => {
      await nextFrames();
      if (cancelled) return;
      // Seed reflections first, so shaders compile once with the final environment configuration.
      seedEnvironment(gl, scene, envResolution);
      const offscreen = new WebGLRenderTarget(1, 1, { type: HalfFloatType });
      try {
        await gl.compileAsync(scene, camera);
        gl.setRenderTarget(offscreen);
        const pending = gl.compileAsync(scene, camera);
        gl.setRenderTarget(null);
        await pending;
      } catch {
        // a compile warm-up failure must never block the visitor
      } finally {
        offscreen.dispose();
      }
      if (cancelled) return;
      setBoot(BOOT_STEPS.indexOf('reflections'), 'reflections');
      await nextFrames();
      if (cancelled) return;
      // Reflections of the real room, captured once while the MacBook still shows the loading screen.
      try {
        if (new URLSearchParams(window.location.search).has('noroomenv')) throw new Error('disabled by ?noroomenv');
        const { ms } = captureRoomEnvironment(gl, scene, envResolution);
        scene.userData.roomEnvironment = true;
        if (capture) (window as unknown as { __envCaptureMs: number }).__envCaptureMs = ms;
      } catch (e) {
        console.warn('Room environment capture failed; keeping the light-card environment.', e);
      }
      if (cancelled) return;
      // 100 % — only now, with everything ready.
      setBoot(BOOT_STEPS.length, null);
      await nextFrames();
      const s = useExperience.getState();
      const confirm = s.skipIntroRequested ? 0 : s.reducedMotion ? 250 : READY_CONFIRM_MS;
      if (confirm) await new Promise((r) => setTimeout(r, confirm));
      // Review tooling only: `?holdready=1` keeps the "Ready" state on screen (for screenshots).
      if (capture && new URLSearchParams(window.location.search).has('holdready')) return;
      if (!cancelled) onReady();
    })();
    return () => {
      cancelled = true;
    };
  }, [sceneMounted, gl, scene, camera, onReady, envResolution]);
  return null;
}

/**
 * The WebGL root. Lazy-loaded so the 2D shell and loader paint before three.js downloads.
 * Renderer settings scale with the device tier decided at boot.
 */
export default function GarageCanvas({ onProgress, onReady }: Props) {
  const tier = useExperience((s) => s.capabilities.tier);
  const full = tier === 'full';
  // While a full-screen sheet covers the scene (phones), stop rendering 3D entirely.
  const narrow = useNarrowViewport();
  const sheetOpen = useExperience((s) => narrow && (s.shot === 'macbook' || s.shot === 'ipad' || s.shot === 'teslaLaptop') && s.arrivedShot === s.shot);

  return (
    <Canvas
      frameloop={sheetOpen ? 'never' : 'always'}
      dpr={full ? [1, 1.75] : [1, 1.5]}
      // Static shadow maps: re-rendered only when a shadow caster moves (see shadows.ts).
      shadows={full ? { type: PCFShadowMap, autoUpdate: false } : false}
      // Full tier antialiases in the post-processing composer (MSAA); reduced tier uses the default buffer.
      gl={{ antialias: !full, powerPreference: 'high-performance', stencil: false }}
      camera={{ fov: 50, near: 0.02, far: 600, position: [0.3, 1.68, 4.35] }}
      onCreated={(state) => {
        const { gl } = state;
        // Review tooling only (`?capture=1`, like __gsap/__store): lets browser tests read the camera,
        // frame clock and raycaster. Nothing is collected or sent.
        if (new URLSearchParams(window.location.search).has('capture')) (window as unknown as { __r3f: unknown }).__r3f = state;
        // Same operator and exposure on both tiers (full tier applies them in post — Effects.tsx).
        gl.toneMapping = RENDERER_TONE_MAPPING[TONE_MAPPING];
        gl.toneMappingExposure = EXPOSURE;
        gl.outputColorSpace = SRGBColorSpace;
      }}
      style={{ position: 'fixed', inset: 0 }}
    >
      <ProgressReporter onProgress={onProgress} />
      <Suspense fallback={null}>
        <GarageScene />
        <ReadySignal onReady={onReady} envResolution={full ? 256 : 128} />
      </Suspense>
    </Canvas>
  );
}
