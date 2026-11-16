import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing';
import { EFFECT_TONE_MAPPING, OPTIONAL_POST, TONE_MAPPING } from './renderConfig';

/**
 * Full tier only: HDR bloom on emissive sources (lamp bulb, screens, LEDs, lightning) + a gentle
 * vignette, then AgX (with the garage look, renderConfig.ts). All three run in one merged effect pass.
 * `?post=off` (review) disables the optional bloom and vignette for comparisons.
 */
export function Effects() {
  return (
    <EffectComposer multisampling={4}>
      {/* Bloom only above HDR 1.0 (bulb, lightning, bright screens); restrained so the lamp keeps a small glow. */}
      {OPTIONAL_POST && <Bloom mipmapBlur intensity={0.5} luminanceThreshold={1} luminanceSmoothing={0.25} />}
      {/* A very subtle lens falloff in the outer corners only. */}
      {OPTIONAL_POST && <Vignette offset={0.3} darkness={0.55} />}
      <ToneMapping mode={EFFECT_TONE_MAPPING[TONE_MAPPING]} />
    </EffectComposer>
  );
}
