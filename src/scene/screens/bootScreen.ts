import { useEffect, useLayoutEffect, useMemo } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { useExperience } from '@/app/store';
import { content, type LocaleContent } from '@/content';
import { BOOT_STEPS, type BootStep } from '../boot';
import { roundRect, SYSTEM_FONT } from './draw';
import { budgetScreenCanvas } from '../materials/textureBudget';

/**
 * The loading screen on the MacBook's display (drawn into the screen texture of the 3D MacBook — not
 * a DOM overlay). Same size and aspect as the Notes screen, so the display mapping is unchanged.
 * Dark, minimal, one restrained accent; type sized to stay legible when the display is ~390 CSS px
 * wide (phone portrait). Redrawn only when a milestone completes or the language changes.
 */
const W = 2048;
const H = 1330;

function draw(g: CanvasRenderingContext2D, c: LocaleContent, step: number, current: BootStep | null) {
  const total = BOOT_STEPS.length;
  const done = step >= total;
  const bg = g.createRadialGradient(W / 2, H * 0.46, 40, W / 2, H * 0.46, W * 0.75);
  bg.addColorStop(0, '#16181c');
  bg.addColorStop(1, '#07080a');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';

  // Title — small, spaced capitals.
  g.fillStyle = '#7f858e';
  g.font = `600 44px ${SYSTEM_FONT}`;
  g.letterSpacing = '9px';
  g.fillText(c.ui.fallback.title.toUpperCase(), W / 2, 470);
  g.letterSpacing = '0px';

  // Main line.
  g.fillStyle = '#eceef1';
  g.font = `500 96px ${SYSTEM_FONT}`;
  g.fillText(done ? c.ui.boot.ready : c.ui.boot.preparing, W / 2, 610);

  // Progress: completed milestones / total (real events, see scene/boot.ts).
  const bw = 1000;
  const bx = (W - bw) / 2;
  const by = 690;
  g.fillStyle = '#2a2d33';
  roundRect(g, bx, by, bw, 12, 6);
  g.fill();
  const frac = Math.min(1, step / total);
  if (frac > 0) {
    g.fillStyle = done ? '#f2d2a2' : '#e3e5e8';
    roundRect(g, bx, by, Math.max(12, bw * frac), 12, 6);
    g.fill();
  }

  // Current milestone + "n of total".
  g.fillStyle = '#9aa0a8';
  g.font = `400 58px ${SYSTEM_FONT}`;
  // While a milestone is in progress the counter shows it ("3 of 8"); when all are done, "8 of 8".
  const n = done ? total : Math.min(step + 1, total);
  const count = c.ui.boot.stepOf.replace('{n}', String(n)).replace('{total}', String(total));
  const label = !done && current ? c.ui.boot.steps[current] : '';
  g.fillText(label ? `${label} · ${count}` : count, W / 2, 800);
}

export function useBootScreenTexture() {
  const locale = useExperience((s) => s.locale);
  const step = useExperience((s) => s.boot.step);
  const current = useExperience((s) => s.boot.current);
  const { canvas, display, texture } = useMemo(() => {
    // Drawn at full size; on phone-sized screens the texture uses a half-size copy (textureBudget.ts).
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const d = budgetScreenCanvas(c);
    const t = new CanvasTexture(d);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 8;
    return { canvas: c, display: d, texture: t };
  }, []);
  // Drawn before the frame renders, so the first visible frame already shows the current state.
  useLayoutEffect(() => {
    draw(canvas.getContext('2d')!, content[locale], step, current);
    if (display !== canvas) budgetScreenCanvas(canvas, display);
    texture.needsUpdate = true;
  }, [canvas, display, texture, locale, step, current]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}
