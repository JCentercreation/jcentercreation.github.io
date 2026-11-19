import { BoxGeometry, type BufferGeometry, ExtrudeGeometry, PlaneGeometry, Shape } from 'three';
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** A plane whose UVs are in "tiles", so one shared tiling texture keeps a constant real-world scale. */
export function tiledPlane(width: number, height: number, tileSize: number) {
  const g = new PlaneGeometry(width, height);
  const uv = g.attributes.uv!;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * width) / tileSize, (uv.getY(i) * height) / tileSize);
  return g;
}

type Axis = 0 | 1 | 2; // x, y, z
const AXIS: Record<'x' | 'y' | 'z', Axis> = { x: 0, y: 1, z: 2 };

/**
 * World-scale UVs for any box-like geometry centred on the origin: each vertex is mapped by the face
 * its normal points to (dominant axis), from the box's minimum corner.
 * - `tile` = [size along u, size along v] in metres; the `grain` axis (default: the longest) runs
 *   along u on every face that contains it, so wood grain wraps continuously around long edges.
 * - End faces (perpendicular to the grain) show the texture across their two axes.
 * - `offsetFaces` shifts v per face so parallel faces don't show identical board patterns
 *   (false keeps a single-span texture, e.g. the desk top, exactly in place).
 */
function applyWorldUVs(g: BufferGeometry, size: [number, number, number], tile: number | [number, number], grain?: 'x' | 'y' | 'z', offsetFaces = true) {
  const [tu, tv] = typeof tile === 'number' ? [tile, tile] : tile;
  const along: Axis = grain ? AXIS[grain] : (size.indexOf(Math.max(...size)) as Axis);
  const pos = g.attributes.position!;
  const nrm = g.attributes.normal!;
  const uv = g.attributes.uv!;
  for (let i = 0; i < pos.count; i++) {
    const p = [pos.getX(i) + size[0] / 2, pos.getY(i) + size[1] / 2, pos.getZ(i) + size[2] / 2];
    const nx = nrm.getX(i);
    const ny = nrm.getY(i);
    const nz = nrm.getZ(i);
    const n = [Math.abs(nx), Math.abs(ny), Math.abs(nz)];
    const face = n.indexOf(Math.max(...n)) as Axis;
    const inPlane = ([0, 1, 2] as Axis[]).filter((a) => a !== face);
    let uAxis: Axis;
    let vAxis: Axis;
    if (inPlane.includes(along)) {
      uAxis = along;
      vAxis = inPlane.find((a) => a !== along)!;
    } else {
      [uAxis, vAxis] = size[inPlane[0]!]! >= size[inPlane[1]!]! ? [inPlane[0]!, inPlane[1]!] : [inPlane[1]!, inPlane[0]!];
    }
    // Face id from the dominant axis and its sign (stable for both boxes and bevelled boxes).
    const sign = [nx, ny, nz][face]! >= 0 ? 0 : 1;
    const faceIndex = face * 2 + sign;
    uv.setXY(i, p[uAxis]! / tu, p[vAxis]! / tv + (offsetFaces ? faceIndex * 0.37 : 0));
  }
  uv.needsUpdate = true;
}

/**
 * A box whose UVs are in world scale on every face, so a shared tiling texture keeps the same
 * physical size on a 7.8 m beam, a 3 cm shelf edge and a 0.2 m post (BoxGeometry's default UVs
 * stretch one whole texture over each face). See applyWorldUVs for the mapping rules.
 */
export function tiledBox(width: number, height: number, depth: number, tile: number | [number, number], grain?: 'x' | 'y' | 'z', offsetFaces = true) {
  const g = new BoxGeometry(width, height, depth);
  applyWorldUVs(g, [width, height, depth], tile, grain, offsetFaces);
  return g;
}

/**
 * A box with small bevelled (eased) edges, same outer dimensions as the box it replaces.
 * Real joinery and steel sections are never knife-sharp: an eased edge catches a thin line of light
 * and reads as a solid object instead of a CG primitive. `bevel` is the size of the ease in metres;
 * `segments` (2 by default) makes it a soft two-facet chamfer. Flat faces keep their exact normals
 * (creased at ~16°), so lighting on the faces is identical to the plain box. World-scale UVs as tiledBox. About 50–100 triangles.
 */
export function bevelledBox(
  width: number,
  height: number,
  depth: number,
  bevel: number,
  tile: number | [number, number],
  grain?: 'x' | 'y' | 'z',
  offsetFaces = true,
  segments = 2,
) {
  const b = Math.max(0.0002, Math.min(bevel, width / 2 - 1e-4, height / 2 - 1e-4, depth / 2 - 1e-4));
  // Rectangle in the XY plane, extruded along Z, then turned so the extrusion is vertical (height).
  const hw = width / 2 - b;
  const hd = depth / 2 - b;
  const s = new Shape();
  s.moveTo(-hw, -hd);
  s.lineTo(hw, -hd);
  s.lineTo(hw, hd);
  s.lineTo(-hw, hd);
  s.closePath();
  const core = height - 2 * b;
  const extruded = new ExtrudeGeometry(s, { depth: core, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: segments, curveSegments: 1 });
  extruded.translate(0, 0, -core / 2);
  extruded.rotateX(-Math.PI / 2);
  // Crease below the bevel's facet angle (~22° with 2 segments): flat faces keep their true normal.
  // (Smoothing a flat face into its bevel tilts the whole face — every vertex of a box face is on its
  // rim — and visibly changes how long, thin pieces like the window casing catch the light.)
  const g = toCreasedNormals(extruded, Math.PI * 0.09);
  if (g !== extruded) extruded.dispose();
  applyWorldUVs(g, [width, height, depth], tile, grain, offsetFaces);
  g.computeBoundingBox();
  g.computeBoundingSphere();
  return g;
}
