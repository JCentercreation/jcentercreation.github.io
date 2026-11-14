import { PlaneGeometry } from 'three';

/** A plane whose UVs are in "tiles", so one shared tiling texture keeps a constant real-world scale. */
export function tiledPlane(width: number, height: number, tileSize: number) {
  const g = new PlaneGeometry(width, height);
  const uv = g.attributes.uv!;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * width) / tileSize, (uv.getY(i) * height) / tileSize);
  return g;
}
