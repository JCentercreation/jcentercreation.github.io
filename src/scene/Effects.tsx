import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { OPTIONAL_POST, TONE_MAPPING, type ToneMappingName } from './renderConfig';

/** Post-processing tone-mapping modes (kept here so `postprocessing` only loads with the full tier's effects). */
const EFFECT_TONE_MAPPING: Record<ToneMappingName, ToneMappingMode> = {
  aces: ToneMappingMode.ACES_FILMIC,
  agx: ToneMappingMode.AGX,
  neutral: ToneMappingMode.NEUTRAL,
};

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
      {/* The approved Phase D vignette, unchanged: softening it (tested: darkness 0.55, offset 0.3) brightened
          the frame edges by ~12% and pulled attention from the desk — it carries the composition. */}
      {OPTIONAL_POST && <Vignette offset={0.22} darkness={0.75} />}
      <ToneMapping mode={EFFECT_TONE_MAPPING[TONE_MAPPING]} />
    </EffectComposer>
  );
}
