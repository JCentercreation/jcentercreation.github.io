import { useEffect, useMemo } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { appleCompanies, automotiveCompanies, automotivePositions, type LocaleContent, type Locale } from '@/content';
import { useExperience } from '@/app/store';
import { content } from '@/content';
import { formatPeriod } from '@/lib/format';
import { SYSTEM_FONT, WIN_FONT, drawLogo, fitText, roundRect, wrapText } from './draw';
import { getLogo, useLogosVersion } from './logos';

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
    drawLogo(g, getLogo(co.id), co.shortName, cx + 36, cy + 36, 110, 110, true);
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

/** Months since Jan 2000, for the timeline. */
function months(ym: string) {
  const [y, m] = ym.split('-');
  return (Number(y) - 2000) * 12 + (m ? Number(m) - 1 : 0);
}

function chip(g: CanvasRenderingContext2D, text: string, x: number, y: number, maxX: number) {
  g.font = `400 18px ${WIN_FONT}`;
  const w = g.measureText(text).width + 20;
  if (x + w > maxX) return null;
  roundRect(g, x, y, w, 30, 4);
  g.fillStyle = '#e4ecf7';
  g.fill();
  g.strokeStyle = '#9db3d3';
  g.lineWidth = 1;
  g.stroke();
  g.fillStyle = '#123a73';
  g.fillText(text, x + 10, y + 21);
  return x + w + 7;
}

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
  const tb = 48;
  const tg = g.createLinearGradient(0, H - tb, 0, H);
  tg.addColorStop(0, '#3a7ce8');
  tg.addColorStop(0.5, '#2459c9');
  tg.addColorStop(1, '#1d4bb0');
  g.fillStyle = tg;
  g.fillRect(0, H - tb, W, tb);
  // Start button — generic, no OS logo.
  roundRect(g, 0, H - tb, 140, tb, 14);
  const sg = g.createLinearGradient(0, H - tb, 0, H);
  sg.addColorStop(0, '#4fae47');
  sg.addColorStop(1, '#2f8a2b');
  g.fillStyle = sg;
  g.fill();
  g.fillStyle = '#ffffff';
  g.font = `italic 700 26px ${WIN_FONT}`;
  g.fillText(c.windows.start, 26, H - 15);
  roundRect(g, 160, H - tb + 6, 360, tb - 12, 6);
  g.fillStyle = '#1e4fb8';
  g.fill();
  g.fillStyle = '#ffffff';
  g.font = `400 19px ${WIN_FONT}`;
  g.fillText(fitText(g, c.automotive.windowTitle, 330), 176, H - 17);
  g.fillStyle = '#1590e8';
  g.fillRect(W - 110, H - tb, 110, tb);
  g.fillStyle = '#ffffff';
  g.fillText(c.windows.clock, W - 80, H - 17);

  // Main window, nearly maximised to use the whole screen.
  const x = 22;
  const y = 18;
  const w = W - 44;
  const h = H - tb - 30;
  roundRect(g, x, y, w, h, 9);
  g.fillStyle = '#0a49c4';
  g.fill();
  const title = 38;
  const tgr = g.createLinearGradient(0, y, 0, y + title);
  tgr.addColorStop(0, '#0a5ce8');
  tgr.addColorStop(0.15, '#3b8cf7');
  tgr.addColorStop(1, '#0548c4');
  g.fillStyle = tgr;
  roundRect(g, x, y, w, title + 8, 9);
  g.fill();
  g.fillStyle = '#ffffff';
  g.font = `700 21px ${WIN_FONT}`;
  g.fillText(c.automotive.windowTitle, x + 16, y + 26);
  [['#3b7cf0', '_'], ['#3b7cf0', '□'], ['#d9512c', '×']].forEach(([col, glyph], i) => {
    const bx = x + w - 112 + i * 36;
    roundRect(g, bx, y + 6, 30, 27, 5);
    g.fillStyle = col!;
    g.fill();
    g.strokeStyle = '#ffffff';
    g.lineWidth = 2;
    g.stroke();
    g.fillStyle = '#ffffff';
    g.font = `700 19px ${WIN_FONT}`;
    g.textAlign = 'center';
    g.fillText(glyph!, bx + 15, y + 26);
    g.textAlign = 'left';
  });

  // Client area.
  const cx = x + 4;
  const cy = y + title + 2;
  const cw = w - 8;
  const ch = h - title - 6;
  g.fillStyle = '#ece9d8';
  g.fillRect(cx, cy, cw, ch);
  g.fillStyle = '#ffffff';
  g.fillRect(cx + 10, cy + 10, cw - 20, ch - 20);
  g.strokeStyle = '#7f9db9';
  g.lineWidth = 1.5;
  g.strokeRect(cx + 10, cy + 10, cw - 20, ch - 20);

  const pad = 36;
  const left = cx + pad;
  const right = cx + cw - pad;
  g.fillStyle = '#0b2f6b';
  g.font = `700 36px ${WIN_FONT}`;
  g.fillText(c.automotive.heading, left, cy + 60);
  g.fillStyle = '#4a4a4a';
  g.font = `400 20px ${WIN_FONT}`;
  g.fillText(c.automotive.subtitle, left, cy + 92);

  // Timeline 2010 → 2020 across the full width.
  const t0 = months('2010');
  const t1 = months('2020');
  const ty = cy + 150;
  const span = right - left;
  const px = (m: number) => left + ((m - t0) / (t1 - t0)) * span;
  g.strokeStyle = '#9aa7b8';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(left, ty + 22);
  g.lineTo(right, ty + 22);
  g.stroke();
  g.fillStyle = '#6b7685';
  g.font = `400 15px ${WIN_FONT}`;
  for (let yr = 2010; yr <= 2020; yr++) {
    const xx = px(months(String(yr)));
    g.fillRect(xx - 1, ty + 18, 2, 9);
    g.textAlign = 'center';
    g.fillText(String(yr), xx, ty + 46);
  }
  g.textAlign = 'left';
  const colours: Record<string, string> = { rfea: '#2f8a2b', nissan: '#0a5ce8', seat: '#d26a17' };
  for (const co of automotiveCompanies) {
    const col = colours[co.id] ?? '#0a5ce8';
    const positions = automotivePositions.filter((p) => p.companyId === co.id);
    positions.forEach((p, i) => {
      const a = px(months(p.period.start));
      const b = px(months(p.period.end ?? '2020'));
      roundRect(g, a, ty + 10, Math.max(4, b - a - 2), 24, 4);
      g.fillStyle = col;
      g.globalAlpha = i % 2 ? 0.75 : 1;
      g.fill();
      g.globalAlpha = 1;
    });
    g.fillStyle = col;
    g.font = `700 16px ${WIN_FONT}`;
    g.fillText(co.shortName, px(months(co.period.start)), ty);
  }

  // Cards, most recent first.
  const ordered = [...automotiveCompanies].sort((a, b) => months(b.period.start) - months(a.period.start));
  const gap = 22;
  const top = ty + 74;
  const colW = (span - gap * 2) / 3;
  const cardH = cy + ch - 26 - top;
  ordered.forEach((co, i) => {
    const bx = left + i * (colW + gap);
    const by = top;
    const inner = colW - 36;
    g.fillStyle = '#f7f6f1';
    g.fillRect(bx, by, colW, cardH);
    g.strokeStyle = '#c4c1b4';
    g.lineWidth = 1.5;
    g.strokeRect(bx, by, colW, cardH);
    g.fillStyle = colours[co.id] ?? '#0a5ce8';
    g.fillRect(bx, by, colW, 5);

    drawLogo(g, getLogo(co.id), co.shortName, bx + 18, by + 22, 150, 64, false);
    g.fillStyle = '#111111';
    g.font = `700 25px ${WIN_FONT}`;
    let yy = wrapText(g, co.name, bx + 184, by + 48, colW - 200, 29);
    g.fillStyle = '#555555';
    g.font = `400 20px ${WIN_FONT}`;
    g.fillText(formatPeriod(co.period, locale, c.ui.present), bx + 184, Math.max(yy, by + 84));
    yy = Math.max(yy + 36, by + 130);

    for (const p of automotivePositions.filter((p) => p.companyId === co.id)) {
      const text = c.automotive.positions[p.id];
      if (!text) continue;
      g.fillStyle = '#0b2f6b';
      g.font = `700 22px ${WIN_FONT}`;
      yy = wrapText(g, text.title, bx + 18, yy, inner, 27);
      g.fillStyle = '#5a5a5a';
      g.font = `400 18px ${WIN_FONT}`;
      yy = wrapText(g, `${formatPeriod(p.period, locale, c.ui.present)} · ${text.location}`, bx + 18, yy, inner, 23) + 12;
    }

    const desc = c.automotive.companies[co.id]?.description;
    g.fillStyle = desc ? '#222222' : '#8a8a8a';
    g.font = `${desc ? 400 : 'italic 400'} 21px ${WIN_FONT}`;
    yy = wrapText(g, desc ?? c.ui.pendingContent, bx + 18, yy + 6, inner, 28) + 10;

    // Confirmed skills / events as chips.
    const highlight = c.automotive.highlights[co.id];
    const chips = [...co.technologies, ...(highlight?.items ?? [])];
    if (chips.length) {
      g.fillStyle = '#6b7685';
      g.font = `700 15px ${WIN_FONT}`;
      g.fillText((highlight?.label ?? c.automotive.labels.technologies).toUpperCase(), bx + 18, yy + 6);
      let cxp = bx + 18;
      let cyp = yy + 18;
      for (const t of chips) {
        let next = chip(g, t, cxp, cyp, bx + colW - 14);
        if (next === null) {
          cxp = bx + 18;
          cyp += 38;
          if (cyp > by + cardH - 34) break;
          next = chip(g, t, cxp, cyp, bx + colW - 14);
        }
        if (next !== null) cxp = next;
      }
    }
  });
}

// ------------------------------------------------------------------ Studio Display: Xcode-like editor

const SWIFT_SAMPLE = [
  'import SwiftUI',
  '',
  'struct WorkbenchView: View {',
  '    @State private var isExploring = false',
  '    let areas = ["Desk", "Library", "Workshop"]',
  '',
  '    var body: some View {',
  '        NavigationStack {',
  '            List(areas, id: \\.self) { area in',
  '                Label(area, systemImage: "square.grid.2x2")',
  '            }',
  '            .navigationTitle("The Engineer\'s Garage")',
  '        }',
  '    }',
  '}',
  '',
  '#Preview {',
  '    WorkbenchView()',
  '}',
];

/** Minimal Swift highlighter in Xcode's default dark palette. */
function drawSwiftLine(g: CanvasRenderingContext2D, line: string, x: number, y: number) {
  const tokens = line.split(/(\s+|"[^"]*"|[{}()\[\],.:=]|#\w+|@\w+|\\\.self)/).filter((t) => t !== '');
  const keywords = new Set(['import', 'struct', 'var', 'let', 'some', 'private', 'in']);
  const types = new Set(['View', 'SwiftUI', 'NavigationStack', 'List', 'Label', 'WorkbenchView']);
  let cx = x;
  for (const t of tokens) {
    let col = '#dfdfe0';
    if (keywords.has(t)) col = '#ff7ab2';
    else if (types.has(t)) col = '#dabaff';
    else if (t.startsWith('"')) col = '#ff8170';
    else if (t.startsWith('@') || t.startsWith('#')) col = '#fd8f3f';
    else if (/^[a-z]\w*$/.test(t) && ['body', 'areas', 'isExploring', 'area', 'navigationTitle', 'systemImage', 'id'].includes(t)) col = '#67b7a4';
    g.fillStyle = col;
    g.fillText(t, cx, y);
    cx += g.measureText(t).width;
  }
}

function drawXcode(g: CanvasRenderingContext2D) {
  const W = 2048;
  const H = 1152;
  g.fillStyle = '#1f1f24';
  g.fillRect(0, 0, W, H);
  // Toolbar.
  g.fillStyle = '#2b2b31';
  g.fillRect(0, 0, W, 64);
  ['#ff5f57', '#febc2e', '#28c840'].forEach((col, i) => {
    g.beginPath();
    g.arc(30 + i * 28, 32, 9, 0, Math.PI * 2);
    g.fillStyle = col;
    g.fill();
  });
  g.fillStyle = '#9a9aa0';
  g.font = `500 22px ${SYSTEM_FONT}`;
  g.fillText('Garage  ›  My Mac', 760, 40);
  // Navigator.
  const nav = 360;
  g.fillStyle = '#25252a';
  g.fillRect(0, 64, nav, H - 64);
  g.font = `400 21px ${SYSTEM_FONT}`;
  const files = ['▾ Garage', '    ▾ App', '        GarageApp.swift', '        WorkbenchView.swift', '    ▾ Models', '        Area.swift', '    ▸ Resources', '    ▸ Tests'];
  files.forEach((f, i) => {
    if (i === 3) {
      g.fillStyle = '#2f4b78';
      g.fillRect(8, 96 + i * 38 - 26, nav - 16, 36);
    }
    g.fillStyle = '#cfcfd4';
    g.fillText(f, 24, 96 + i * 38);
  });
  // Tabs.
  g.fillStyle = '#2a2a30';
  g.fillRect(nav, 64, W - nav, 44);
  g.fillStyle = '#dfdfe0';
  g.font = `500 20px ${SYSTEM_FONT}`;
  g.fillText('WorkbenchView.swift', nav + 24, 93);
  // Editor.
  g.font = `400 26px Menlo, "SF Mono", Monaco, Consolas, monospace`;
  SWIFT_SAMPLE.forEach((line, i) => {
    const y = 160 + i * 40;
    g.fillStyle = '#5c5c66';
    g.textAlign = 'right';
    g.fillText(String(i + 1), nav + 64, y);
    g.textAlign = 'left';
    drawSwiftLine(g, line, nav + 96, y);
  });
  // Canvas (preview) pane.
  const px = 1500;
  g.fillStyle = '#18181c';
  g.fillRect(px, 108, W - px, H - 108);
  roundRect(g, px + 120, 220, 300, 620, 44);
  g.fillStyle = '#000';
  g.fill();
  g.fillStyle = '#f2f2f7';
  roundRect(g, px + 134, 234, 272, 592, 34);
  g.fill();
  g.fillStyle = '#111';
  g.font = `700 24px ${SYSTEM_FONT}`;
  g.fillText("Engineer's Garage", px + 154, 310);
  ['Desk', 'Library', 'Workshop'].forEach((a, i) => {
    g.fillStyle = '#ffffff';
    g.fillRect(px + 150, 340 + i * 56, 240, 50);
    g.fillStyle = '#111';
    g.font = `400 20px ${SYSTEM_FONT}`;
    g.fillText(a, px + 168, 372 + i * 56);
  });
}

// ------------------------------------------------------------------ hooks

type Kind = 'notes' | 'ipad' | 'windows' | 'xcode';

/** A screen texture that redraws when the language changes (camera and state untouched). */
export function useScreenTexture(kind: Kind) {
  const locale = useExperience((s) => s.locale);
  const logos = useLogosVersion();
  const texture = useMemo(() => {
    const c = content[locale];
    if (kind === 'notes') return make(2048, 1330, (g) => drawNotes(g, c));
    if (kind === 'ipad') return make(2048, 1536, (g) => drawIPad(g, c, locale));
    if (kind === 'xcode') return make(2048, 1152, drawXcode);
    return make(1600, 1000, (g) => drawWindows(g, c, locale));
    // `logos` re-draws once official logo files have loaded.
  }, [kind, locale, logos]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}
