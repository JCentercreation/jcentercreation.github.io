import { ACESFilmicToneMapping, AgXToneMapping, NeutralToneMapping, ShaderChunk, type ToneMapping } from 'three';
import { ToneMappingMode } from 'postprocessing';

/**
 * One source of truth for colour pipeline settings, applied identically on both tiers:
 * - reduced tier: the renderer tone-maps (gl.toneMapping / gl.toneMappingExposure);
 * - full tier: the post-processing ToneMapping effect does (the renderer draws into HDR targets).
 *
 * Review flags (comparisons only, never needed by visitors):
 *   ?tm=aces|agx|neutral   ?exposure=<number>   ?env=<number> (room reflection intensity)
 *   ?envglow=<number> (window card strength in the room capture)
 */
export type ToneMappingName = 'aces' | 'agx' | 'neutral';

const params = new URLSearchParams(window.location.search);
const tmParam = params.get('tm');
const num = (k: string) => {
  const v = Number(params.get(k));
  return params.has(k) && Number.isFinite(v) && v > 0 ? v : null;
};

/** AgX (approved after the Phase A comparison): natural timber, graceful lamp roll-off. */
export const TONE_MAPPING: ToneMappingName = tmParam === 'agx' || tmParam === 'neutral' || tmParam === 'aces' ? tmParam : 'agx';

/**
 * Explicit exposure, both tiers. 0.8 with AgX keeps the night-time darkness of the approved ACES look
 * (overall level within ~20%) while AgX's softer toe keeps shadows readable.
 */
export const EXPOSURE = num('exposure') ?? 0.8;

export const RENDERER_TONE_MAPPING: Record<ToneMappingName, ToneMapping> = {
  aces: ACESFilmicToneMapping,
  agx: AgXToneMapping,
  neutral: NeutralToneMapping,
};

export const EFFECT_TONE_MAPPING: Record<ToneMappingName, ToneMappingMode> = {
  aces: ToneMappingMode.ACES_FILMIC,
  agx: ToneMappingMode.AGX,
  neutral: ToneMappingMode.NEUTRAL,
};

/** Room-capture reflection strength (scene.environmentIntensity once the room has been captured). */
export const ENV_INTENSITY = num('env') ?? 1.0;

/**
 * Strength of an optional window light card during the room capture (1 = the window light's own
 * radiance). Off by default: the window's rect-area light already provides both its diffuse light and
 * its specular highlights, so putting it in the environment too would count the window twice.
 */
export const ENV_WINDOW_GLOW = num('envglow') ?? 0;

/**
 * AgX "look" (final grade), applied inside AgX itself — the standard AgX look slot, after its sigmoid
 * and before the output transform — so there is still exactly one tone-mapping stage, and both tiers get
 * the identical grade: the reduced tier tone-maps in the material shaders and the full tier in the
 * post-processing ToneMapping effect, and both use three's AgXToneMapping chunk.
 *
 * AgX's default look desaturates warm highlights (the lamp pool, lit oak) compared with the approved
 * ACES-era image. A small saturation lift (×1.1 around luma) restores part of that warmth without changing
 * brightness, contrast or the near-black share; the storm window stays neutral blue-grey. A contrast
 * (power) curve was measured and rejected: in AgX's display space it darkens the whole image (−17% at
 * 1.12) and crushes shadows (near-black 29% → 39%) — effectively an exposure change.
 * Review flags: ?look=none (identity), ?lookpower=, ?looksat=, ?lookslope=.
 */
export const AGX_LOOK = params.get('look') === 'none'
  ? { slope: 1, power: 1, saturation: 1 }
  : { slope: num('lookslope') ?? 1.0, power: num('lookpower') ?? 1.0, saturation: num('looksat') ?? 1.1 };

// Anchored on the sigmoid call (three's shipped build strips the "Apply AgX look" comment).
const LOOK_MARKER = 'color = agxDefaultContrastApprox( color );';
if (ShaderChunk.tonemapping_pars_fragment.includes(LOOK_MARKER)) {
  const f = (n: number) => n.toFixed(4);
  ShaderChunk.tonemapping_pars_fragment = ShaderChunk.tonemapping_pars_fragment.replace(
    LOOK_MARKER,
    `${LOOK_MARKER}
    {
      // Garage look (renderConfig.ts): slope / power (contrast) / saturation around Rec.709 luma.
      color = pow( max( vec3( 0.0 ), color * ${f(AGX_LOOK.slope)} ), vec3( ${f(AGX_LOOK.power)} ) );
      float lookLuma = dot( color, vec3( 0.2126, 0.7152, 0.0722 ) );
      color = lookLuma + ${f(AGX_LOOK.saturation)} * ( color - lookLuma );
    }`,
  );
}

/** Review flag: ?post=off disables the optional full-tier effects (bloom, vignette) for comparisons. */
if (!ShaderChunk.tonemapping_pars_fragment.includes('Garage look') && (AGX_LOOK.power !== 1 || AGX_LOOK.saturation !== 1 || AGX_LOOK.slope !== 1))
  console.warn('AgX look could not be applied: three.js AgX shader changed.');

export const OPTIONAL_POST = params.get('post') !== 'off';
