import { BoxGeometry, CatmullRomCurve3, TubeGeometry, Vector3 } from 'three';

/**
 * Upholstered cushion: a subdivided box whose edges are rounded to `radius` (vertices concentrated
 * towards the edges, where the curvature is), with a gentle crown on one face so it reads as a filled,
 * slightly domed leather cushion rather than a flat slab. The crown stays INSIDE the original
 * envelope: the base is `crown` thinner, so the overall size is unchanged.
 *
 * - `crownFace: 'top'`   → the +y face domes up (seat);
 * - `crownFace: 'front'` → the −z face domes forward (backrest, facing the sitter).
 * UVs are planar per face in metres (the leather grain material tiles at a real-world scale).
 * About 1,000 triangles per cushion.
 */
export function cushionGeometry(width: number, height: number, depth: number, radius: number, crown: number, crownFace: 'top' | 'front', seg: [number, number, number] = [12, 5, 12]) {
  const [w, h, d] = crownFace === 'top' ? [width, height - crown, depth] : [width, height, depth - crown];
  const g = new BoxGeometry(w, h, d, ...seg);
  const pos = g.attributes.position!;
  const nrm = g.attributes.normal!;
  const uv = g.attributes.uv!;
  const half = [w / 2, h / 2, d / 2];
  const r = Math.min(radius, ...half.map((x) => x - 1e-4));
  const inner = half.map((x) => x - r);
  // Concentrate grid lines towards the edges (|t|^0.65), then round the box onto `inner` + r.
  const bias = (c: number, hx: number) => Math.sign(c) * Math.pow(Math.abs(c) / hx, 0.65) * hx;
  for (let i = 0; i < pos.count; i++) {
    const p = [bias(pos.getX(i), half[0]!), bias(pos.getY(i), half[1]!), bias(pos.getZ(i), half[2]!)];
    // Planar UVs (metres) from the face this vertex belongs to.
    const n = [Math.abs(nrm.getX(i)), Math.abs(nrm.getY(i)), Math.abs(nrm.getZ(i))];
    const face = n.indexOf(Math.max(...n));
    const [a, b] = face === 0 ? [2, 1] : face === 1 ? [0, 2] : [0, 1];
    uv.setXY(i, p[a]! + half[a]!, p[b]! + half[b]!);
    // Round.
    const q = p.map((c, k) => Math.max(-inner[k]!, Math.min(inner[k]!, c)));
    const dv = p.map((c, k) => c - q[k]!);
    const len = Math.hypot(dv[0]!, dv[1]!, dv[2]!);
    if (len > 1e-9) for (let k = 0; k < 3; k++) p[k] = q[k]! + (dv[k]! / len) * r;
    // Crown: strongest at the centre of the face, fading to zero at its rounded rim.
    if (crownFace === 'top') {
      const up = Math.max(0, (p[1]! + half[1]!) / (2 * half[1]!));
      const fx = Math.max(0, 1 - (p[0]! / half[0]!) ** 2);
      const fz = Math.max(0, 1 - (p[2]! / half[2]!) ** 2);
      p[1] = p[1]! + crown * up * up * fx * fz;
    } else {
      const fwd = Math.max(0, (half[2]! - p[2]!) / (2 * half[2]!));
      const fx = Math.max(0, 1 - (p[0]! / half[0]!) ** 2);
      const fy = Math.max(0, 1 - (p[1]! / half[1]!) ** 2);
      p[2] = p[2]! - crown * fwd * fwd * fx * fy;
    }
    pos.setXYZ(i, p[0]!, p[1]!, p[2]!);
  }
  g.computeVertexNormals();
  // Centre the envelope where the original slab was (the crown fills the removed `crown`).
  if (crownFace === 'top') g.translate(0, -crown / 2, 0);
  else g.translate(0, 0, crown / 2);
  g.computeBoundingBox();
  g.computeBoundingSphere();
  return g;
}

/**
 * A closed rounded-rectangle path for a piping seam (leather welt) along a cushion edge.
 * `plane: 'xz'` at height `level` (seat top edge); `plane: 'xy'` at depth `level` (backrest front edge).
 */
export function pipingGeometry(halfA: number, halfB: number, cornerRadius: number, level: number, plane: 'xz' | 'xy', tube = 0.0026) {
  const pts: Vector3[] = [];
  const steps = 6;
  const corners: [number, number, number][] = [
    [halfA - cornerRadius, halfB - cornerRadius, 0],
    [-(halfA - cornerRadius), halfB - cornerRadius, Math.PI / 2],
    [-(halfA - cornerRadius), -(halfB - cornerRadius), Math.PI],
    [halfA - cornerRadius, -(halfB - cornerRadius), (3 * Math.PI) / 2],
  ];
  for (const [ca, cb, a0] of corners)
    for (let k = 0; k <= steps; k++) {
      const a = a0 + (k / steps) * (Math.PI / 2);
      const pa = ca + Math.cos(a) * cornerRadius;
      const pb = cb + Math.sin(a) * cornerRadius;
      pts.push(plane === 'xz' ? new Vector3(pa, level, pb) : new Vector3(pa, pb, level));
    }
  const curve = new CatmullRomCurve3(pts, true, 'centripetal');
  return new TubeGeometry(curve, 72, tube, 6, true);
}
