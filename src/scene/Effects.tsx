import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing';
import { EFFECT_TONE_MAPPING, TONE_MAPPING } from './renderConfig';

/** Full tier only: HDR bloom on emissive sources (lamp bulb, screens, LEDs, lightning) + a gentle vignette. */
export function Effects() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom mipmapBlur intensity={0.65} luminanceThreshold={1} luminanceSmoothing={0.25} />
      <Vignette offset={0.22} darkness={0.75} />
      <ToneMapping mode={EFFECT_TONE_MAPPING[TONE_MAPPING]} />
    </EffectComposer>
  );
}
