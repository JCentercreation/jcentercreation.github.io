import { useEffect, useMemo } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { appleCompanies, automotiveCompanies, automotivePositions, type LocaleContent, type Locale } from '@/content';
import { useExperience } from '@/app/store';
import { content } from '@/content';
import { formatPeriod } from '@/lib/format';
import { SYSTEM_FONT, WIN_FONT, fitText, logoPending, roundRect, wrapText } from './draw';

/**
 * PROTOTYPE screen contents, drawn to textures from the content layer.
 * These are what the devices show from a distance and in the cinematic shots. The fully
 * interactive versions (DOM UIs mounted on the screen when the camera arrives) come in
 * the MacBook / iPad / automotive phases and will use the same content.
 */

function make(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  draw(g);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// ------------------------------------------------------------------ MacBook: Notes

function drawNotes(g: CanvasRenderingContext2D, c: LocaleContent) {
  const W = 2048;
  const H = 1330;
  // Window chrome.
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, W, H);
  const side = 360;
  const list = 520;
  g.fillStyle = '#eceaee';
  g.fillRect(0, 0, side, H);
  g.fillStyle = '#f7f6f8';
  g.fillRect(side, 0, list, H);
  g.fillStyle = '#d9d8dc';
  g.fillRect(side, 0, 2, H);
  g.fillRect(side + list, 0, 2, H);
  // Traffic lights.
  ['#ff5f57', '#febc2e', '#28c840'].forEach((col, i) => {
    g.beginPath();
    g.arc(44 + i * 40, 46, 13, 0, Math.PI * 2);
    g.fillStyle = col;
    g.fill();
  });

  // Sidebar: one folder.
  g.font = `600 26px ${SYSTEM_FONT}`;
  g.fillStyle = '#8e8e93';
  g.fillText('iCloud', 36, 140);
  roundRect(g, 20, 160, side - 40, 58, 12);
  g.fillStyle = '#e2c33a';
  g.globalAlpha = 0.28;
  g.fill();
  g.globalAlpha = 1;
  g.fillStyle = '#1d1d1f';
  g.font = `500 30px ${SYSTEM_FONT}`;
  g.fillText(c.macbook.folder, 40, 199);
  g.fillStyle = '#8e8e93';
  g.textAlign = 'right';
  g.fillText('6', side - 40, 199);
  g.textAlign = 'left';

  // Note list: each portfolio section is a note.
  const notes = [
    [c.macbook.notes.welcome, c.welcome.body[0] ?? ''],
    [c.macbook.notes.experience, appleCompanies.map((a) => a.name).join(', ')],
    [c.macbook.notes.technologies, c.apple.profile.languages.items.concat(c.apple.profile.uiFrameworks.items).join(', ')],
    [c.macbook.notes.leadership, c.apple.profile.leadership.items.slice(0, 3).join(', ')],
    [c.macbook.notes.startups, c.apple.startups.intro],
    [c.macbook.notes.projects, 'writingfree, necktimer, PROOF…'],
  ] as const;
  notes.forEach(([title, preview], i) => {
    const y = 110 + i * 132;
    if (i === 0) {
      roundRect(g, side + 16, y - 10, list - 32, 118, 14);
      g.fillStyle = '#f5d74a';
      g.fill();
    }
    g.fillStyle = '#1d1d1f';
    g.font = `700 30px ${SYSTEM_FONT}`;
    g.fillText(fitText(g, title, list - 80), side + 40, y + 36);
    g.fillStyle = i === 0 ? '#4a4022' : '#8e8e93';
    g.font = `400 26px ${SYSTEM_FONT}`;
    g.fillText(fitText(g, preview, list - 80), side + 40, y + 78);
    if (i > 0) {
      g.fillStyle = '#e5e5ea';
      g.fillRect(side + 40, y - 12, list - 80, 2);
    }
  });

  // The welcome note itself.
  const x = side + list + 110;
  const maxW = W - x - 120;
  g.fillStyle = '#1d1d1f';
  g.font = `700 64px ${SYSTEM_FONT}`;
  g.fillText(c.welcome.title, x, 190);
  let y = 290;
  g.font = `400 38px ${SYSTEM_FONT}`;
  for (const p of c.welcome.body) y = wrapText(g, p, x, y, maxW, 54) + 22;
  y += 18;
  g.font = `700 36px ${SYSTEM_FONT}`;
  g.fillText(c.welcome.discover.heading, x, y);
  y += 58;
  g.font = `400 33px ${SYSTEM_FONT}`;
  for (const item of c.welcome.discover.items) {
    g.fillText('•', x, y);
    y = wrapText(g, item, x + 34, y, maxW - 34, 46) + 8;
  }
}

// ------------------------------------------------------------------ iPad: Apple portfolio

function drawIPad(g: CanvasRenderingContext2D, c: LocaleContent, locale: Locale) {
  const W = 2048;
  const H = 1536;
  g.fillStyle = '#000000';
  g.fillRect(0, 0, W, H);
  // Status bar.
  g.fillStyle = '#ffffff';
  g.font = `600 30px ${SYSTEM_FONT}`;
  g.fillText('23:47', 48, 52);
  // Sidebar.
  const side = 520;
  g.fillStyle = '#1c1c1e';
  g.fillRect(0, 80, side, H - 80);
  g.fillStyle = '#ffffff';
  g.font = `700 52px ${SYSTEM_FONT}`;
  g.fillText(c.apple.heading, 44, 180);
  const sections = Object.values(c.apple.sections);
  sections.forEach((label, i) => {
    const y = 250 + i * 96;
    if (i === 0) {
      roundRect(g, 24, y, side - 48, 80, 18);
      g.fillStyle = '#0a84ff';
      g.fill();
    }
    g.fillStyle = '#ffffff';
    g.font = `500 32px ${SYSTEM_FONT}`;
    g.fillText(fitText(g, label, side - 110), 56, y + 52);
  });

  // Experience: company cards.
  const x0 = side + 64;
  g.fillStyle = '#ffffff';
  g.font = `700 60px ${SYSTEM_FONT}`;
  g.fillText(c.apple.sections.experience, x0, 190);
  const cardW = (W - x0 - 64 - 40) / 2;
  const cardH = 300;
  appleCompanies.forEach((co, i) => {
    const cx = x0 + (i % 2) * (cardW + 40);
    const cy = 250 + Math.floor(i / 2) * (cardH + 40);
    roundRect(g, cx, cy, cardW, cardH, 28);
    g.fillStyle = '#1c1c1e';
    g.fill();
    logoPending(g, co.name, cx + 36, cy + 36, 110, true);
    g.fillStyle = '#ffffff';
    g.font = `700 40px ${SYSTEM_FONT}`;
    g.fillText(fitText(g, co.name, cardW - 200), cx + 176, cy + 86);
    g.fillStyle = '#8e8e93';
    g.font = `500 32px ${SYSTEM_FONT}`;
    g.fillText(formatPeriod(co.period, locale, c.ui.present), cx + 176, cy + 134);
    g.font = `400 30px ${SYSTEM_FONT}`;
    const desc = c.apple.companies[co.id]?.description ?? c.ui.pendingContent;
    wrapText(g, desc, cx + 36, cy + 220, cardW - 72, 40);
  });
  // Startups card (anonymised, no names).
  const sy = 250 + 2 * (cardH + 40);
  roundRect(g, x0, sy, W - x0 - 64, 250, 28);
  g.fillStyle = '#1c1c1e';
  g.fill();
  g.fillStyle = '#ffffff';
  g.font = `700 40px ${SYSTEM_FONT}`;
  g.fillText(c.apple.startups.heading, x0 + 36, sy + 74);
  g.fillStyle = '#c7c7cc';
  g.font = `400 32px ${SYSTEM_FONT}`;
  wrapText(g, c.apple.startups.intro, x0 + 36, sy + 134, W - x0 - 140, 44);
}

// ------------------------------------------------------------------ Laptop: Windows-style

function drawWindows(g: CanvasRenderingContext2D, c: LocaleContent, locale: Locale) {
  const W = 1600;
  const H = 1000;
  // Classic blue desktop.
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#2a6fd6');
  bg.addColorStop(1, '#1b4fa8');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);

  // Taskbar.
  const tb = 52;
  const tg = g.createLinearGradient(0, H - tb, 0, H);
  tg.addColorStop(0, '#3a7ce8');
  tg.addColorStop(0.5, '#2459c9');
  tg.addColorStop(1, '#1d4bb0');
  g.fillStyle = tg;
  g.fillRect(0, H - tb, W, tb);
  // Start button — generic, no OS logo.
  roundRect(g, 0, H - tb, 150, tb, 14);
  const sg = g.createLinearGradient(0, H - tb, 0, H);
  sg.addColorStop(0, '#4fae47');
  sg.addColorStop(1, '#2f8a2b');
  g.fillStyle = sg;
  g.fill();
  g.fillStyle = '#ffffff';
  g.font = `italic 700 28px ${WIN_FONT}`;
  g.fillText(c.windows.start, 28, H - 16);
  // Task button + clock.
  roundRect(g, 170, H - tb + 7, 360, tb - 14, 6);
  g.fillStyle = '#1e4fb8';
  g.fill();
  g.fillStyle = '#ffffff';
  g.font = `400 21px ${WIN_FONT}`;
  g.fillText(fitText(g, c.automotive.windowTitle, 320), 188, H - 19);
  g.fillStyle = '#1590e8';
  g.fillRect(W - 120, H - tb, 120, tb);
  g.fillStyle = '#ffffff';
  g.fillText(c.windows.clock, W - 88, H - 19);

  // Main window.
  const x = 70;
  const y = 50;
  const w = W - 140;
  const h = H - tb - 90;
  roundRect(g, x, y, w, h, 10);
  g.fillStyle = '#0a49c4';
  g.fill();
  const title = 46;
  const tgr = g.createLinearGradient(0, y, 0, y + title);
  tgr.addColorStop(0, '#0a5ce8');
  tgr.addColorStop(0.15, '#3b8cf7');
  tgr.addColorStop(1, '#0548c4');
  g.fillStyle = tgr;
  roundRect(g, x, y, w, title + 10, 10);
  g.fill();
  g.fillStyle = '#ffffff';
  g.font = `700 24px ${WIN_FONT}`;
  g.fillText(c.automotive.windowTitle, x + 18, y + 31);
  // Min / max / close.
  [['#3b7cf0', '_'], ['#3b7cf0', '□'], ['#d9512c', '×']].forEach(([col, glyph], i) => {
    const bx = x + w - 134 + i * 42;
    roundRect(g, bx, y + 8, 34, 32, 5);
    g.fillStyle = col!;
    g.fill();
    g.strokeStyle = '#ffffff';
    g.lineWidth = 2;
    g.stroke();
    g.fillStyle = '#ffffff';
    g.font = `700 22px ${WIN_FONT}`;
    g.textAlign = 'center';
    g.fillText(glyph!, bx + 17, y + 31);
    g.textAlign = 'left';
  });
  // Client area.
  const cx = x + 5;
  const cy = y + title + 4;
  const cw = w - 10;
  const ch = h - title - 9;
  g.fillStyle = '#ece9d8';
  g.fillRect(cx, cy, cw, ch);
  g.fillStyle = '#ffffff';
  g.fillRect(cx + 16, cy + 16, cw - 32, ch - 32);
  g.strokeStyle = '#7f9db9';
  g.lineWidth = 2;
  g.strokeRect(cx + 16, cy + 16, cw - 32, ch - 32);

  g.fillStyle = '#0b2f6b';
  g.font = `700 40px ${WIN_FONT}`;
  g.fillText(c.automotive.heading, cx + 48, cy + 80);
  g.fillStyle = '#555555';
  g.font = `400 24px ${WIN_FONT}`;
  g.fillText(c.automotive.subtitle, cx + 48, cy + 118);

  const colW = (cw - 96 - 40) / 3;
  automotiveCompanies.forEach((co, i) => {
    const bx = cx + 48 + i * (colW + 20);
    const by = cy + 150;
    g.fillStyle = '#f4f3ee';
    g.fillRect(bx, by, colW, ch - 200);
    g.strokeStyle = '#c4c1b4';
    g.strokeRect(bx, by, colW, ch - 200);
    logoPending(g, co.name, bx + 16, by + 16, 64, false);
    g.fillStyle = '#000000';
    g.font = `700 22px ${WIN_FONT}`;
    let ty = wrapText(g, co.name, bx + 94, by + 42, colW - 110, 26);
    ty = Math.max(ty, by + 110);
    g.fillStyle = '#444444';
    g.font = `400 18px ${WIN_FONT}`;
    g.fillText(formatPeriod(co.period, locale, c.ui.present), bx + 16, ty);
    ty += 34;
    for (const p of automotivePositions.filter((p) => p.companyId === co.id)) {
      const text = c.automotive.positions[p.id];
      if (!text) continue;
      g.fillStyle = '#0b2f6b';
      g.font = `700 18px ${WIN_FONT}`;
      ty = wrapText(g, text.title, bx + 16, ty, colW - 32, 22);
      g.fillStyle = '#555555';
      g.font = `400 16px ${WIN_FONT}`;
      ty = wrapText(g, `${formatPeriod(p.period, locale, c.ui.present)} · ${text.location}`, bx + 16, ty, colW - 32, 20) + 8;
    }
    g.fillStyle = co.technologies.length || c.automotive.companies[co.id]?.description ? '#222222' : '#888888';
    g.font = `400 17px ${WIN_FONT}`;
    wrapText(g, c.automotive.companies[co.id]?.description ?? c.ui.pendingContent, bx + 16, ty + 6, colW - 32, 22);
  });
}

// ------------------------------------------------------------------ hooks

type Kind = 'notes' | 'ipad' | 'windows';

/** A screen texture that redraws when the language changes (camera and state untouched). */
export function useScreenTexture(kind: Kind) {
  const locale = useExperience((s) => s.locale);
  const texture = useMemo(() => {
    const c = content[locale];
    if (kind === 'notes') return make(2048, 1330, (g) => drawNotes(g, c));
    if (kind === 'ipad') return make(2048, 1536, (g) => drawIPad(g, c, locale));
    return make(1600, 1000, (g) => drawWindows(g, c, locale));
  }, [kind, locale]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}
