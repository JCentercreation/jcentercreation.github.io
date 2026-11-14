import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useProgress } from '@react-three/drei';
import { ACESFilmicToneMapping, PCFShadowMap, SRGBColorSpace } from 'three';
import { useExperience } from '@/app/store';
import { GarageScene } from './GarageScene';

interface Props {
  onProgress: (pct: number) => void;
  onReady: () => void;
}

/** Bridges drei's loading manager progress out to the DOM loader. */
function ProgressReporter({ onProgress }: Pick<Props, 'onProgress'>) {
  const { progress, active } = useProgress();
  useEffect(() => {
    onProgress(active ? progress : 100);
  }, [progress, active, onProgress]);
  return null;
}

/** Mounted once Suspense resolves, i.e. every asset in the scene graph has loaded. */
function ReadySignal({ onReady }: Pick<Props, 'onReady'>) {
  useEffect(() => {
    onReady();
  }, [onReady]);
  return null;
}

/**
 * The WebGL root. Lazy-loaded so the 2D shell and loader paint before three.js downloads.
 * Renderer settings scale with the device tier decided at boot.
 */
export default function GarageCanvas({ onProgress, onReady }: Props) {
  const tier = useExperience((s) => s.capabilities.tier);
  const full = tier === 'full';

  return (
    <Canvas
      dpr={full ? [1, 1.75] : [1, 1.5]}
      shadows={full ? { type: PCFShadowMap } : false}
      // Full tier antialiases in the post-processing composer (MSAA); reduced tier uses the default buffer.
      gl={{ antialias: !full, powerPreference: 'high-performance', stencil: false }}
      camera={{ fov: 50, near: 0.02, far: 600, position: [0.3, 1.68, 4.35] }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.outputColorSpace = SRGBColorSpace;
      }}
      style={{ position: 'fixed', inset: 0 }}
    >
      <ProgressReporter onProgress={onProgress} />
      <Suspense fallback={null}>
        <GarageScene />
        <ReadySignal onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}
