import type { Locale, Period, YearMonth } from '@/content';

function formatYearMonth(ym: YearMonth, locale: Locale): string {
  const [y, m] = ym.split('-');
  if (!m) return y ?? ym;
  const date = new Date(Number(y), Number(m) - 1, 1);
  return new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' }).format(date);
}

export function formatPeriod(p: Period, locale: Locale, presentLabel: string): string {
  return `${formatYearMonth(p.start, locale)} – ${p.end ? formatYearMonth(p.end, locale) : presentLabel}`;
}
