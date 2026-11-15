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

  it('book shelf places are unique so positions are stable', () => {
    const places = books.map((b) => `${b.place.shelf}/${b.place.bay}/${b.place.at}`);
    expect(new Set(places).size).toBe(places.length);
  });
});

describe('projects', () => {
  it('every personal project has text in each locale', async () => {
    const { projects } = await import('./index');
    for (const locale of LOCALES)
      for (const p of projects) expect(content[locale].macbook.projects[p.id], `${locale}:${p.id}`).toBeDefined();
  });
});

describe('approved MacBook portfolio content (source of truth)', () => {
  const roles: Record<string, string> = {
    sabadell: 'iOS Software Engineer',
    misfits: 'Founder & iOS Engineer',
    inditex: 'iOS Engineer',
    santander: 'iOS Software Engineer',
  };

  it('every Apple-platforms company has the approved role and a description in both locales', () => {
    for (const locale of LOCALES)
      for (const co of appleCompanies) {
        const text = content[locale].apple.companies[co.id];
        expect(text?.role, `${locale}:${co.id}`).toBe(roles[co.id]);
        expect(text?.description, `${locale}:${co.id}`).toBeTruthy();
      }
  });

  it('periods match the approved dates', () => {
    const periods = Object.fromEntries(appleCompanies.map((c) => [c.id, `${c.period.start}–${c.period.end ?? 'present'}`]));
    expect(periods).toEqual({ sabadell: '2020–2021', misfits: '2020–present', inditex: '2023–2024', santander: '2024–2025' });
  });

  it('descriptions are exactly the approved wording', () => {
    expect(content.en.apple.companies.santander?.description).toBe(
      "Developed new features for the bank's iOS application and mentored new team members joining the team.",
    );
    expect(content.es.apple.companies.santander?.description).toBe(
      'Desarrollo de nuevas funcionalidades para la aplicación iOS del banco y mentoría y acompañamiento de nuevas incorporaciones al equipo.',
    );
    expect(content.en.apple.companies.inditex?.description).toContain('acting as the iOS technical reference');
    expect(content.es.apple.companies.misfits?.description).toMatch(/^Fundador de Misfits Studio/);
  });

  it('About me keeps its approved wording', () => {
    expect(content.en.macbook.about.paragraphs[0]).toBe(
      'I started my career as a software engineer developing powertrain embedded software at companies like Nissan and SEAT.',
    );
    expect(content.es.macbook.about.paragraphs[0]).toBe(
      'Empecé mi carrera como ingeniero de software desarrollando software embebido de tren motriz en empresas como Nissan y SEAT.',
    );
    expect(content.en.macbook.about.paragraphs).toHaveLength(4);
    expect(content.es.macbook.about.paragraphs).toHaveLength(4);
  });
});

describe('owner content decisions', () => {
  it('job titles stay in English in both locales', () => {
    for (const co of appleCompanies) expect(content.es.apple.companies[co.id]?.role).toBe(content.en.apple.companies[co.id]?.role);
  });

  it('approved project texts are published as confirmed', () => {
    expect(content.en.macbook.projects.proof?.description).toContain('The beta-tester community is growing.');
    expect(content.en.macbook.projects['swift-courses']?.description).toBe('Learning resources for the developer community.');
    expect(content.es.macbook.projects['swift-courses']?.description).toBe('Recursos de aprendizaje para la comunidad de desarrolladores.');
  });

  it('Swift course titles are kept and flagged provisional internally', async () => {
    const { projects } = await import('./index');
    const courses = projects.find((p) => p.id === 'swift-courses');
    expect(courses?.provisionalNames).toBe(true);
    expect(courses?.links?.map((l) => l.name)).toEqual(['Swift Concurrency Explained', 'Swift Security Course']);
  });
});

describe('iPad career data accuracy', () => {
  it('lists exactly the confirmed technologies and patterns', async () => {
    const { iosTechnologies, architecturePatterns } = await import('./index');
    expect(iosTechnologies.map((t) => t.name)).toEqual(['Swift', 'Objective-C', 'UIKit', 'SwiftUI']);
    expect(architecturePatterns.map((p) => p.name)).toEqual(['MVC', 'MVVM', 'MVP', 'VIPER', 'MV', 'TCA']);
  });

  it('lists exactly the confirmed practices', () => {
    const p = content.en.ipad.practices;
    expect(p.testing.items).toEqual(['Unit testing', 'UI testing', 'End-to-end testing', 'Test coverage']);
    expect(p.delivery.items).toEqual(['App Store Connect', 'TestFlight', 'App Store releases']);
    expect(p.technical.items).toEqual(['Architecture decisions', 'Performance decisions', 'Security decisions']);
  });

  it('links each leadership item only to companies whose approved description documents it', async () => {
    const { leadershipContext } = await import('./index');
    const evidence: Record<string, RegExp> = {
      techReference: /iOS technical reference/,
      interviews: /technical interviews/,
      mentoring: /mentored new team members/,
      guidance: /technical guidance/,
      decisions: /engineering decisions/,
    };
    for (const item of leadershipContext)
      for (const id of item.companies) expect(content.en.apple.companies[id]?.description, `${item.id}→${id}`).toMatch(evidence[item.id]!);
  });

  it('keeps job titles in English on the iPad (shared company text)', () => {
    for (const co of appleCompanies) expect(content.es.apple.companies[co.id]?.role).toBe(content.en.apple.companies[co.id]?.role);
  });
});

describe('bookshelf catalogue', () => {
  it('each book has its selected cover, subtitle, first-publication year and descriptions in both locales', async () => {
    const files = Object.keys(import.meta.glob('/public/books/*'));
    for (const b of books) {
      expect(files, b.id).toContain(`/public/${b.cover}`);
      expect(b.subtitle, b.id).toBeTruthy();
      expect(b.firstPublished, b.id).toBeGreaterThan(1900);
      for (const locale of LOCALES) expect(content[locale].books.descriptions[b.id], `${locale}:${b.id}`).toBeTruthy();
    }
  });

  it('titles and authors are the original published ones', () => {
    expect(books.map((b) => `${b.title}: ${b.subtitle} — ${b.author}`)).toEqual([
      'Sapiens: A Brief History of Humankind — Yuval Noah Harari',
      'The Rise and Fall of the Dinosaurs: A New History of Their Lost World — Steve Brusatte',
      'The Emperor of All Maladies: A Biography of Cancer — Siddhartha Mukherjee',
    ]);
  });
});

describe('approved automotive career data', () => {
  it('positions, periods, English titles and locations match the approved list', () => {
    const rows = automotivePositions.map((p) => {
      const t = content.en.automotive.positions[p.id]!;
      return `${p.companyId} ${p.period.start}→${p.period.end} ${t.title} @ ${t.location}`;
    });
    expect(rows).toEqual([
      'nissan 2016-09→2017-02 Software Engineer – Powertrain ETB @ Barcelona, Spain',
      'nissan 2017-02→2017-04 Software Engineer – Powertrain ETB @ Cranfield, United Kingdom',
      'nissan 2017-04→2018-08 Software Engineer – Powertrain Performance @ Barcelona, Spain',
      'seat 2018-10→2019-11 Software Engineer @ Greater Barcelona Metropolitan Area',
      'rfea 2010-04→2012-06 Technical Scrutineer @ Circuito Ricardo Tormo and Valencia Street Circuit, Valencia',
    ]);
    for (const p of automotivePositions) expect(content.es.automotive.positions[p.id]?.title).toBe(content.en.automotive.positions[p.id]?.title);
  });

  it('technologies, venues and events are exactly the established ones', () => {
    expect(Object.fromEntries(automotiveCompanies.map((c) => [c.id, c.technologies]))).toEqual({
      nissan: ['C++', 'C'],
      seat: ['Clean Coding', 'Git'],
      rfea: [],
    });
    expect(content.en.automotive.portfolio.venues).toEqual(['Circuito Ricardo Tormo', 'Valencia Street Circuit']);
    expect(content.en.automotive.highlights.rfea?.items).toHaveLength(5);
    expect(content.en.automotive.companies.nissan?.description).toBeNull();
  });

  it('simple-version notice only claims incompatibility when that is the actual reason', () => {
    const incompatible = /can't run|no puede ejecutar/i;
    for (const locale of LOCALES) {
      const r = content[locale].ui.fallback.reasons;
      expect(r.unsupported, locale).toMatch(incompatible);
      expect(r.chosen, locale).not.toMatch(incompatible);
      expect(r.failed, locale).not.toMatch(incompatible);
    }
  });
});
