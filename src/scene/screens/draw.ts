export const SYSTEM_FONT = `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif`;
export const WIN_FONT = `Tahoma, "Segoe UI", Verdana, Arial, sans-serif`;

export function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/** Draws wrapped text; returns the y after the last line. */
export function wrapText(g: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ');
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (g.measureText(test).width > maxWidth && line) {
      g.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else line = test;
  }
  if (line) g.fillText(line, x, y);
  return y + lineHeight;
}

/** Ellipsize to fit one line. */
export function fitText(g: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (g.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && g.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1);
  return `${t}…`;
}

/** Neutral stand-in until the official logo file is supplied: never a fake logo, just initials. */
export function logoPending(g: CanvasRenderingContext2D, name: string, x: number, y: number, s: number, dark: boolean) {
  roundRect(g, x, y, s, s, s * 0.22);
  g.fillStyle = dark ? '#2c2c2e' : '#e5e5ea';
  g.fill();
  g.fillStyle = dark ? '#8e8e93' : '#6e6e73';
  g.font = `600 ${s * 0.34}px ${SYSTEM_FONT}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const initials = name
    .replace(/[(),.]/g, '')
    .split(/\s+/)
    .filter((w) => /^[A-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join('');
  g.fillText(initials, x + s / 2, y + s / 2 + 1);
  g.textAlign = 'left';
  g.textBaseline = 'alphabetic';
}
