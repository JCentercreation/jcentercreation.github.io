import { CanvasTexture, SRGBColorSpace } from 'three';
import { makeNoise } from '../materials/noise';

const cache = new Map<string, CanvasTexture>();

/** Wool rug with a soft border and fibre noise. Provisional, generated. */
export function rugTexture(key: string, base: [number, number, number], border: [number, number, number]) {
  const hit = cache.get(key);
  if (hit) return hit;
  const W = 512;
  const H = 384;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  const img = g.createImageData(W, H);
  const { fbm, noise } = makeNoise(key.length * 17 + 3);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const u = x / W;
      const v = y / H;
      const edge = Math.min(u, 1 - u, v * 0.75, (1 - v) * 0.75);
      const inBorder = edge < 0.05 && edge > 0.03;
      const col = inBorder ? border : base;
      const n = 0.9 + fbm(u, v, 8, 3) * 0.15 + (noise(x * 0.9, y * 0.9) - 0.5) * 0.12;
      const i = (y * W + x) * 4;
      img.data[i] = col[0] * n;
      img.data[i + 1] = col[1] * n;
      img.data[i + 2] = col[2] * n;
      img.data[i + 3] = 255;
    }
  g.putImageData(img, 0, 0);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  cache.set(key, t);
  return t;
}
