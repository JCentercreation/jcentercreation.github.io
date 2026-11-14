import { Color } from 'three';

/**
 * Phase 1: an empty, correctly configured stage (night background + fog).
 * Phase 2 replaces this with the garage environment, lighting, window, rain and lightning.
 * Deliberately no placeholder models here (spec §16.8).
 */
export function GarageScene() {
  return (
    <>
      <primitive attach="background" object={new Color('#05070b')} />
      <fog attach="fog" args={['#05070b', 8, 40]} />
      <ambientLight intensity={0.05} />
    </>
  );
}
