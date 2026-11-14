import { describe, expect, it } from 'vitest';
import { content, appleCompanies, automotiveCompanies, automotivePositions, books, LOCALES } from './index';

/** Recursively collect object key paths (array lengths included) to compare locale shapes. */
function shape(value: unknown, path = ''): string[] {
  if (Array.isArray(value)) return [`${path}[${value.length}]`, ...value.flatMap((v, i) => shape(v, `${path}[${i}]`))];
  if (value && typeof value === 'object')
    return Object.entries(value).flatMap(([k, v]) => [`${path}.${k}`, ...shape(v, `${path}.${k}`)]);
  return [];
}

describe('content', () => {
  it('every locale has exactly the same structure as English', () => {
    const reference = shape(content.en).sort();
    for (const locale of LOCALES) expect(shape(content[locale]).sort()).toEqual(reference);
  });

  it('every company and position has localized text in each locale', () => {
    for (const locale of LOCALES) {
      const c = content[locale];
      for (const co of appleCompanies) expect(c.apple.companies[co.id], `${locale}:${co.id}`).toBeDefined();
      for (const co of automotiveCompanies) expect(c.automotive.companies[co.id], `${locale}:${co.id}`).toBeDefined();
      for (const p of automotivePositions) expect(c.automotive.positions[p.id], `${locale}:${p.id}`).toBeDefined();
    }
  });

  it('positions reference known companies', () => {
    const ids = new Set(automotiveCompanies.map((c) => c.id));
    for (const p of automotivePositions) expect(ids.has(p.companyId)).toBe(true);
  });

  it('book shelf slots are unique so positions are stable', () => {
    const slots = books.map((b) => b.slot);
    expect(new Set(slots).size).toBe(slots.length);
  });
});

describe('projects', () => {
  it('every personal project has text in each locale', async () => {
    const { projects } = await import('./index');
    for (const locale of LOCALES)
      for (const p of projects) expect(content[locale].macbook.projects[p.id], `${locale}:${p.id}`).toBeDefined();
  });
});
