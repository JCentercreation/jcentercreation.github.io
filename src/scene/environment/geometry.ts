import { BoxGeometry, PlaneGeometry } from 'three';

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
 * A box whose UVs are in world scale on every face, so a shared tiling texture keeps the same
 * physical size on a 7.8 m beam, a 3 cm shelf edge and a 0.2 m post (BoxGeometry's default UVs
 * stretch one whole texture over each face).
 *
 * - `tile` = [size along u, size along v] in metres. Wood textures in this project run their grain
 *   along u, so `grain` (default: the box's longest axis) is mapped to u on every face that contains
 *   it — the grain then wraps continuously around the long edges.
 * - Coordinates are measured from the box's minimum corner, so a box exactly one tile in size maps
 *   the texture exactly once (no wrap seam through the middle).
 * - End faces (perpendicular to the grain) show the texture across their two axes.
 * - Each face gets a small v offset so parallel faces don't show identical board patterns
 *   (`offsetFaces: false` keeps a single-span texture, e.g. the desk top, exactly in place).
 */
export function tiledBox(
  width: number,
  height: number,
  depth: number,
  tile: number | [number, number],
  grain?: 'x' | 'y' | 'z',
  offsetFaces = true,
) {
  const g = new BoxGeometry(width, height, depth);
  const [tu, tv] = typeof tile === 'number' ? [tile, tile] : tile;
  const size = [width, height, depth];
  const along: Axis = grain ? AXIS[grain] : (size.indexOf(Math.max(...size)) as Axis);
  const pos = g.attributes.position!;
  const nrm = g.attributes.normal!;
  const uv = g.attributes.uv!;
  for (let i = 0; i < uv.count; i++) {
    const p = [pos.getX(i) + width / 2, pos.getY(i) + height / 2, pos.getZ(i) + depth / 2];
    const n = [Math.abs(nrm.getX(i)), Math.abs(nrm.getY(i)), Math.abs(nrm.getZ(i))];
    const face = n.indexOf(Math.max(...n)) as Axis;
    const inPlane = ([0, 1, 2] as Axis[]).filter((a) => a !== face);
    let uAxis: Axis;
    let vAxis: Axis;
    if (inPlane.includes(along)) {
      uAxis = along;
      vAxis = inPlane.find((a) => a !== along)!;
    } else {
      // End grain: larger extent along u.
      [uAxis, vAxis] = size[inPlane[0]!]! >= size[inPlane[1]!]! ? [inPlane[0]!, inPlane[1]!] : [inPlane[1]!, inPlane[0]!];
    }
    const faceIndex = Math.floor(i / 4); // BoxGeometry: 6 faces × 4 vertices (1 segment)
    uv.setXY(i, p[uAxis]! / tu, p[vAxis]! / tv + (offsetFaces ? faceIndex * 0.37 : 0));
  }
  return g;
}
