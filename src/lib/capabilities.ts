export type RenderTier = 'full' | 'reduced' | 'fallback';

export interface Capabilities {
  webgl2: boolean;
  touch: boolean;
  smallScreen: boolean;
  lowMemory: boolean;
  tier: RenderTier;
  /** Why this tier was chosen (diagnostics and tests). */
  tierReason: string;
}

/** Capability signals read once at boot (all cheap: no benchmarking). */
export interface TierSignals {
  webgl2: boolean;
  /** Shorter side of the screen, CSS px. */
  minScreen: number;
  /** navigator.deviceMemory (GB), when the browser reports it. */
  deviceMemory?: number;
  /** navigator.hardwareConcurrency, when the browser reports it. */
  cores?: number;
  /** The WebGL renderer string, when available. */
  gpu?: string;
}

/** Renderers that draw on the CPU: the full tier (shadows, post-processing, MSAA) would be far too slow. */
const SOFTWARE_GPU = /swiftshader|llvmpipe|softpipe|software|microsoft basic render/i;

/**
 * Rendering tier from capability signals, not input type. Phones and genuinely constrained devices get
 * the reduced tier; capable tablets are no longer downgraded just because they have a touch screen.
 * - fallback: no WebGL2 → 2D content page.
 * - reduced: software rendering · phone-sized screen (shorter side < 600 px) · ≤ 4 GB reported memory ·
 *   ≤ 4 reported CPU cores.
 * - full: everything else (desktops, laptops and capable tablets).
 */
export function chooseTier(s: TierSignals): { tier: RenderTier; reason: string } {
  if (!s.webgl2) return { tier: 'fallback', reason: 'no WebGL2' };
  if (s.gpu && SOFTWARE_GPU.test(s.gpu)) return { tier: 'reduced', reason: 'software renderer' };
  if (s.minScreen < 600) return { tier: 'reduced', reason: 'phone-sized screen' };
  if (s.deviceMemory !== undefined && s.deviceMemory <= 4) return { tier: 'reduced', reason: `${s.deviceMemory} GB memory` };
  if (s.cores !== undefined && s.cores <= 4) return { tier: 'reduced', reason: `${s.cores} CPU cores` };
  return { tier: 'full', reason: 'capable device' };
}

function probeWebGL(): { webgl2: boolean; gpu?: string } {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return { webgl2: false };
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const gpu = (info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)) as string | undefined;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return { webgl2: true, gpu: typeof gpu === 'string' ? gpu : undefined };
  } catch {
    return { webgl2: false };
  }
}

/**
 * Device tiering, decided once at boot (see chooseTier).
 * `?tier=full|reduced|fallback` overrides for testing.
 */
export function detectCapabilities(): Capabilities {
  const { webgl2, gpu } = probeWebGL();
  const touch = matchMedia('(pointer: coarse)').matches;
  const minScreen = Math.min(window.innerWidth, window.innerHeight);
  const nav = navigator as Navigator & { deviceMemory?: number };
  const deviceMemory = typeof nav.deviceMemory === 'number' ? nav.deviceMemory : undefined;
  const cores = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency > 0 ? navigator.hardwareConcurrency : undefined;

  let { tier, reason } = chooseTier({ webgl2, minScreen, deviceMemory, cores, gpu });

  const forced = new URLSearchParams(window.location.search).get('tier');
  if (forced === 'full' || forced === 'reduced' || forced === 'fallback') {
    tier = forced;
    reason = '?tier override';
  }

  return { webgl2, touch, smallScreen: minScreen < 600, lowMemory: deviceMemory !== undefined && deviceMemory <= 4, tier, tierReason: reason };
}
