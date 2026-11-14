import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useProgress } from '@react-three/drei';
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three';
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
      dpr={full ? [1, 2] : [1, 1.5]}
      shadows={full}
      gl={{ antialias: full, powerPreference: 'high-performance' }}
      camera={{ fov: 40, near: 0.05, far: 200, position: [0, 1.6, 6] }}
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
