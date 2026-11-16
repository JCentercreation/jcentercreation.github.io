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
