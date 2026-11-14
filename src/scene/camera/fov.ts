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
