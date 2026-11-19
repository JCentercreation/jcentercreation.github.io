import { useExperience } from '@/app/store';

/**
 * GPU texture budget per rendering tier. Textures are always generated exactly as on the full tier (same
 * pattern, same scale); on constrained tiers the finished canvas is downsampled before upload, which costs
 * a quarter of the GPU memory per halving and matches what the GPU would sample on a small screen anyway.
 * - Material textures of 1024 px or more: half resolution on the reduced tier. Smaller ones are untouched.
 * - Screen canvases (MacBook, iPad, Studio Display, car laptop, loading screen): half resolution only on
 *   phone-sized screens, where even the close-up display spans fewer device pixels than the halved canvas.
 * The full tier keeps every texture at full resolution.
 */
export const LARGE_TEXTURE = 1024;

export function materialTextureScale(): number {
  return useExperience.getState().capabilities.tier === 'full' ? 1 : 0.5;
}

export function screenTextureScale(): number {
  return useExperience.getState().capabilities.smallScreen ? 0.5 : 1;
}

/** A smoothly downsampled copy of `src` (or `src` itself when no reduction applies). */
export function downscale(src: HTMLCanvasElement, k: number, into?: HTMLCanvasElement): HTMLCanvasElement {
  if (k >= 1) return src;
  const c = into ?? document.createElement('canvas');
  const w = Math.max(1, Math.round(src.width * k));
  const h = Math.max(1, Math.round(src.height * k));
  if (c.width !== w) c.width = w;
  if (c.height !== h) c.height = h;
  const g = c.getContext('2d')!;
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = 'high';
  g.clearRect(0, 0, w, h);
  g.drawImage(src, 0, 0, w, h);
  return c;
}

/** Material textures: downsampled on constrained tiers when large. */
export function budgetMaterialCanvas(src: HTMLCanvasElement): HTMLCanvasElement {
  return Math.max(src.width, src.height) >= LARGE_TEXTURE ? downscale(src, materialTextureScale()) : src;
}

/** Screen canvases: downsampled on phone-sized screens. */
export function budgetScreenCanvas(src: HTMLCanvasElement, into?: HTMLCanvasElement): HTMLCanvasElement {
  return downscale(src, screenTextureScale(), into);
}
