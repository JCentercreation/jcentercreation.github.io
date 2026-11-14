export type RenderTier = 'full' | 'reduced' | 'fallback';

export interface Capabilities {
  webgl2: boolean;
  touch: boolean;
  smallScreen: boolean;
  lowMemory: boolean;
  tier: RenderTier;
}

function hasWebGL2(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    const ok = !!gl;
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return ok;
  } catch {
    return false;
  }
}

/**
 * Rough device tiering, decided once at boot.
 * - fallback: no WebGL2 → 2D content page.
 * - reduced: phones / low-memory devices → simplified 3D (lower DPR, no shadows, fewer effects).
 * - full: everything else.
 * `?tier=full|reduced|fallback` overrides for testing.
 */
export function detectCapabilities(): Capabilities {
  const webgl2 = hasWebGL2();
  const touch = matchMedia('(pointer: coarse)').matches;
  const smallScreen = Math.min(window.innerWidth, window.innerHeight) < 600;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const lowMemory = mem !== undefined && mem <= 4;

  let tier: RenderTier = !webgl2 ? 'fallback' : touch || smallScreen || lowMemory ? 'reduced' : 'full';

  const forced = new URLSearchParams(window.location.search).get('tier');
  if (forced === 'full' || forced === 'reduced' || forced === 'fallback') tier = forced;

  return { webgl2, touch, smallScreen, lowMemory, tier };
}
