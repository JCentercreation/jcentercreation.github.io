import { ACESFilmicToneMapping, AgXToneMapping, NeutralToneMapping, type ToneMapping } from 'three';
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

/** Current operator. Kept at ACES until a comparison-based decision is approved. */
export const TONE_MAPPING: ToneMappingName = tmParam === 'agx' || tmParam === 'neutral' || tmParam === 'aces' ? tmParam : 'aces';

/** Explicit exposure (previously implicit 1.0 on both tiers). */
export const EXPOSURE = num('exposure') ?? 1.0;

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
