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

/**
 * Company logo: the official file when supplied (fitted, original proportions and colours);
 * otherwise a clearly marked placeholder — dashed outline + short name — never a fake logo.
 */
export function drawLogo(
  g: CanvasRenderingContext2D,
  logo: HTMLImageElement | null,
  shortName: string,
  x: number,
  y: number,
  w: number,
  h: number,
  dark: boolean,
) {
  if (logo) {
    const k = Math.min(w / logo.naturalWidth, h / logo.naturalHeight);
    const lw = logo.naturalWidth * k;
    const lh = logo.naturalHeight * k;
    g.drawImage(logo, x + (w - lw) / 2, y + (h - lh) / 2, lw, lh);
    return;
  }
  g.save();
  roundRect(g, x + 1, y + 1, w - 2, h - 2, Math.min(w, h) * 0.12);
  g.setLineDash([6, 5]);
  g.lineWidth = 2;
  g.strokeStyle = dark ? '#48484a' : '#b8b5a8';
  g.stroke();
  g.fillStyle = dark ? '#8e8e93' : '#8a877c';
  g.font = `600 ${Math.min(h * 0.26, w * 0.16)}px ${SYSTEM_FONT}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(shortName.toUpperCase(), x + w / 2, y + h / 2 + 1);
  g.restore();
}
