import { MathUtils } from 'three';

const REF_ASPECT = 16 / 9;
const MAX_FOV = 78;

/** Keep each shot's horizontal framing on narrower screens (portrait phones widen the FOV, capped). */
export function responsiveFov(fov: number, aspect: number) {
  if (aspect >= REF_ASPECT) return fov;
  const h = 2 * Math.atan(Math.tan(MathUtils.degToRad(fov) / 2) * REF_ASPECT);
  const v = MathUtils.radToDeg(2 * Math.atan(Math.tan(h / 2) / aspect));
  return Math.min(v, MAX_FOV);
}

/**
 * When the FOV cap prevents keeping a shot's horizontal framing (portrait phones), the distance factor
 * by which the camera must move back along its view direction to show the same width again. 1 when the
 * cap is not reached.
 */
export function fitDistanceFactor(fov: number, aspect: number) {
  if (aspect >= REF_ASPECT) return 1;
  const wantH = Math.atan(Math.tan(MathUtils.degToRad(fov) / 2) * REF_ASPECT); // half horizontal angle at 16:9
  const vfov = responsiveFov(fov, aspect);
  const gotH = Math.atan(Math.tan(MathUtils.degToRad(vfov) / 2) * aspect);
  return Math.max(1, Math.tan(wantH) / Math.tan(gotH));
}

/** Phone landscape: little height, plenty of width (CSS px). */
const SHORT_VIEWPORT = 500;

/**
 * Phone landscape only (wide and short viewport): the factor by which to move back from a close-up so an
 * object extending `halfExtent` above/below the target fits the frame height with `margin` (fraction of the
 * height) to spare. 1 elsewhere — desktop and portrait framings are unchanged.
 */
export function landscapeFitFactor(fov: number, distance: number, halfExtent: number, aspect: number, heightPx: number, margin = 0.06) {
  if (aspect <= REF_ASPECT || heightPx > SHORT_VIEWPORT) return 1;
  const halfView = distance * Math.tan(MathUtils.degToRad(fov) / 2);
  return Math.max(1, halfExtent / ((1 - 2 * margin) * halfView));
}
