import { CanvasTexture, SRGBColorSpace } from 'three';
import { roundRect } from '../screens/draw';

let macDeck: CanvasTexture | null = null;

/** MacBook Pro 14" top case: black keys, speaker grilles either side, large trackpad. Provisional. */
export function macbookDeckTexture() {
  if (macDeck) return macDeck;
  const W = 1563; // 312.6 mm
  const H = 1106; // 221.2 mm
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  g.fillStyle = '#c4c6c9';
  g.fillRect(0, 0, W, H);
  // Keyboard well.
  const kx = 200;
  const ky = 70;
  const kw = W - 400;
  const kh = 560;
  roundRect(g, kx - 10, ky - 10, kw + 20, kh + 20, 18);
  g.fillStyle = '#8e9093';
  g.fill();
  const rows = [14, 14, 14, 13, 12, 10];
  const rowH = kh / 6;
  rows.forEach((n, r) => {
    const h = r === 0 ? rowH * 0.62 : rowH * 0.86;
    const y = ky + (r === 0 ? 0 : rowH * 0.62 + (r - 1) * rowH) + 6;
    const keyW = kw / n;
    for (let i = 0; i < n; i++) {
      let x = kx + i * keyW + 5;
      let w = keyW - 10;
      // Wider modifier keys on the lower rows; space bar on the last row.
      if (r === 5 && i === 4) w = keyW * 3 - 10;
      if (r === 5 && i > 4 && i < 7) continue;
      if (r === 5 && i >= 7) x = kx + (i - 2) * keyW + 5 + keyW * 2;
      roundRect(g, x, y, w, h - 10, 10);
      g.fillStyle = '#121214';
      g.fill();
    }
  });
  // Speaker grilles.
  g.fillStyle = '#5c5e61';
  for (const sx of [70, W - 130]) for (let y = 80; y < 620; y += 16) for (let x = sx; x < sx + 60; x += 16) g.beginPath(), g.arc(x, y, 3.2, 0, Math.PI * 2), g.fill();
  // Trackpad.
  roundRect(g, W / 2 - 300, 690, 600, 380, 26);
  g.fillStyle = '#cacbce';
  g.fill();
  g.strokeStyle = '#a6a8ab';
  g.lineWidth = 3;
  g.stroke();
  macDeck = new CanvasTexture(c);
  macDeck.colorSpace = SRGBColorSpace;
  macDeck.anisotropy = 8;
  return macDeck;
}

let lock: CanvasTexture | null = null;
/** iPhone lock screen, dimmed (notification-glow level). Generic, no wallpaper. */
export function lockScreenTexture() {
  if (lock) return lock;
  const c = document.createElement('canvas');
  c.width = 330;
  c.height = 716;
  const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, 0, 716);
  grad.addColorStop(0, '#0f1a2b');
  grad.addColorStop(1, '#06080d');
  g.fillStyle = grad;
  g.fillRect(0, 0, 330, 716);
  g.fillStyle = '#e9edf5';
  g.textAlign = 'center';
  g.font = '600 92px -apple-system, "Helvetica Neue", Arial, sans-serif';
  g.fillText('23:47', 165, 210);
  g.font = '500 22px -apple-system, "Helvetica Neue", Arial, sans-serif';
  g.globalAlpha = 0.7;
  g.fillText('●', 165, 110);
  lock = new CanvasTexture(c);
  lock.colorSpace = SRGBColorSpace;
  return lock;
}
