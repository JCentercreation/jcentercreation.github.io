import { BufferGeometry, ExtrudeGeometry, Shape, Vector2 } from 'three';
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { CAR } from '../layout';

/**
 * PROVISIONAL procedural Model 3–like body, built from a side profile (car-local: +X forward,
 * +Y up, Z across, driver on -Z). The profile is extruded across the width, then "tumblehome"
 * tapering pulls the sides in towards the roof and the nose/tail so it reads as a car rather
 * than a slab. The body is split around a real driver-door opening, so the door can swing
 * open and the interior is visible.
 *
 * The final asset will be a licensed model with the same contract: a separate door node
 * hinged at the front edge, and a usable interior.
 */

const WHEELBASE = 2.875;
export const AXLE_X = WHEELBASE / 2;
export const WHEEL_RADIUS = 0.335;
export const WHEEL_Y = WHEEL_RADIUS;
export const TRACK_HALF = 0.79;
const ARCH_R = 0.395;
export const BODY_HALF = 0.92;
export const DOOR_BOTTOM = 0.36;

function sideProfile(): Vector2[] {
  const s = new Shape();
  const a0 = Math.PI + 0.384;
  const a1 = -0.384;
  const dx = Math.cos(0.384) * ARCH_R;
  s.moveTo(2.1, 0.17);
  s.quadraticCurveTo(2.33, 0.2, 2.35, 0.4);
  s.quadraticCurveTo(2.37, 0.58, 2.22, 0.66);
  s.quadraticCurveTo(1.7, 0.8, 1.02, 0.93);
  s.lineTo(-1.3, 0.985);
  s.quadraticCurveTo(-1.95, 1.02, -2.25, 0.97);
  s.quadraticCurveTo(-2.38, 0.92, -2.36, 0.7);
  s.quadraticCurveTo(-2.35, 0.3, -2.12, 0.2);
  s.lineTo(-AXLE_X - dx, 0.19);
  s.absarc(-AXLE_X, 0.34, ARCH_R, a0, a1, true);
  s.lineTo(AXLE_X - dx, 0.19);
  s.absarc(AXLE_X, 0.34, ARCH_R, a0, a1, true);
  s.lineTo(2.1, 0.17);
  const pts = s.getPoints(10);
  // Drop the duplicated closing point.
  if (pts.length > 1 && pts[0]!.distanceTo(pts[pts.length - 1]!) < 1e-6) pts.pop();
  return pts;
}

function greenhouseProfile(): Vector2[] {
  const s = new Shape();
  s.moveTo(1.04, 0.93);
  s.quadraticCurveTo(0.55, 1.3, 0.05, 1.43);
  s.quadraticCurveTo(-0.45, 1.47, -0.78, 1.4);
  s.quadraticCurveTo(-1.28, 1.22, -1.58, 0.99);
  s.lineTo(-1.58, 0.9);
  s.lineTo(1.04, 0.9);
  return s.getPoints(12);
}

/** Sutherland–Hodgman clip of a polygon against one axis-aligned half-plane. */
function clip(poly: Vector2[], axis: 'x' | 'y', value: number, keepAbove: boolean): Vector2[] {
  const inside = (p: Vector2) => (keepAbove ? p[axis] >= value : p[axis] <= value);
  const out: Vector2[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!;
    const b = poly[(i + 1) % poly.length]!;
    const ia = inside(a);
    const ib = inside(b);
    if (ia) out.push(a);
    if (ia !== ib) {
      const t = (value - a[axis]) / (b[axis] - a[axis]);
      out.push(new Vector2(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t));
    }
  }
  return out;
}

function clipBox(poly: Vector2[], b: { x0?: number; x1?: number; y0?: number; y1?: number }) {
  let p = poly;
  if (b.x0 !== undefined) p = clip(p, 'x', b.x0, true);
  if (b.x1 !== undefined) p = clip(p, 'x', b.x1, false);
  if (b.y0 !== undefined) p = clip(p, 'y', b.y0, true);
  if (b.y1 !== undefined) p = clip(p, 'y', b.y1, false);
  return p;
}

const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/** Half-width scale of the body at (x, y): tumblehome, rounded nose, tucked tail and sills. */
export function bodyTaper(x: number, y: number) {
  return (
    (1 - 0.085 * smooth(0.62, 1.02, y)) *
    // Rounded nose and tail in plan view (eased so the corners curve rather than chamfer).
    (1 - 0.3 * Math.pow(smooth(1.45, 2.4, x), 1.6)) *
    (1 - 0.2 * Math.pow(smooth(1.6, 2.4, -x), 1.6)) *
    // Hood and trunk surfaces fall away towards the edges.
    (1 - 0.05 * smooth(0.5, 0.9, y) * smooth(1.2, 2.2, Math.abs(x))) *
    (1 - 0.05 * smooth(0.42, 0.17, y))
  );
}

function greenhouseTaper(x: number, y: number) {
  return (1 - 0.24 * smooth(0.95, 1.46, y)) * (1 - 0.06 * smooth(0.3, 1.04, x));
}

function extrude(poly: Vector2[], depth: number, bevel: number, z0: number, taper: (x: number, y: number) => number) {
  const g = new ExtrudeGeometry(new Shape(poly), {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: -bevel,
    bevelSegments: 4,
    curveSegments: 8,
  });
  g.translate(0, 0, z0);
  const pos = g.attributes.position!;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    pos.setZ(i, pos.getZ(i) * taper(x, y));
  }
  // Smooth across the tapered panels, keep real creases (panel cuts, sills) sharp.
  return toCreasedNormals(g, 0.75);
}

export interface CarGeometry {
  bodyParts: BufferGeometry[];
  greenhouse: BufferGeometry;
  door: BufferGeometry;
  /** Hinge position (car-local) the door geometry is expressed relative to. */
  doorPivot: [number, number, number];
}

export function buildCarGeometry(): CarGeometry {
  const profile = sideProfile();
  const gap = 0.006;
  const bevel = 0.1;
  const fullDepth = BODY_HALF * 2 - bevel * 2;
  const z0 = -fullDepth / 2;
  const { doorFront, doorRear } = CAR;

  const front = extrude(clipBox(profile, { x0: doorFront + gap }), fullDepth, bevel, z0, bodyTaper);
  const rear = extrude(clipBox(profile, { x1: doorRear - gap }), fullDepth, bevel, z0, bodyTaper);
  // Under the door: the sill runs the full width.
  const sill = extrude(clipBox(profile, { x0: doorRear, x1: doorFront, y1: DOOR_BOTTOM }), fullDepth, 0.03, -BODY_HALF + 0.03, bodyTaper);
  // Passenger side of the middle section (the closed far door), a thin skin.
  const farSide = extrude(clipBox(profile, { x0: doorRear, x1: doorFront, y0: DOOR_BOTTOM - 0.02 }), 0.05, 0.012, BODY_HALF - 0.062, bodyTaper);

  const ghDepth = 1.2;
  const greenhouse = extrude(greenhouseProfile(), ghDepth, 0.08, -ghDepth / 2, greenhouseTaper);

  // Driver door skin, built in place then re-expressed around its front hinge.
  const doorPoly = clipBox(profile, { x0: doorRear + gap, x1: doorFront - gap, y0: DOOR_BOTTOM });
  const door = extrude(doorPoly, 0.05, 0.012, -BODY_HALF + 0.002, bodyTaper);
  const pivot: [number, number, number] = [doorFront, 0, -BODY_HALF * bodyTaper(doorFront, 0.7)];
  door.translate(-pivot[0], -pivot[1], -pivot[2]);
  door.computeBoundingSphere();

  return { bodyParts: [front, rear, sill, farSide], greenhouse, door, doorPivot: pivot };
}
