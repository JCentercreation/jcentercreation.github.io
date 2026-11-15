import { useEffect, useRef, type KeyboardEvent } from 'react';
import { AUTO_SECTIONS, automotiveCompanies, automotivePositions, type AutoSection, type CompanyRecord } from '@/content';
import { useExperience } from '@/app/store';
import { useContent } from '@/app/useContent';
import { formatPeriod } from '@/lib/format';
import styles from './AutoPortfolio.module.css';

/**
 * Automotive engineering portfolio on the laptop in the car: a restrained, Windows-inspired desktop
 * with one maximised window (task pane + content) and a taskbar.
 * `screen`: on the laptop's 3D display (1280 × 816 CSS px). `sheet`: full-screen on phones/portrait.
 * Escape is handled globally (Hud): section → overview → car interior → garage.
 */

const COLORS: Record<string, string> = { nissan: '#1d5fd1', seat: '#c4621c', rfea: '#2c8a3a' };
const months = (ym: string) => {
  const [y, m] = ym.split('-');
  return (Number(y) - 2000) * 12 + (m ? Number(m) - 1 : 0);
};

function Logo({ company }: { company: CompanyRecord }) {
  return company.logo ? (
    <span className={styles.logo}>
      <img src={`${import.meta.env.BASE_URL}${company.logo}`} alt="" />
    </span>
  ) : (
    // Placeholder until an official file is supplied — never a fake logo.
    <span className={`${styles.logo} ${styles.logoPending}`}>{company.shortName}</span>
  );
}

function Timeline() {
  const c = useContent();
  const locale = useExperience((s) => s.locale);
  const t0 = months('2010');
  const t1 = months('2020');
  const pct = (m: number) => `${((m - t0) / (t1 - t0)) * 100}%`;
  return (
    <figure className={styles.timeline}>
      <figcaption>{c.automotive.portfolio.timeline}</figcaption>
      <div className={styles.track}>
        {automotivePositions.map((p) => {
          const a = months(p.period.start);
          const b = months(p.period.end ?? '2020');
          const text = c.automotive.positions[p.id];
          return (
            <span
              key={p.id}
              className={styles.bar}
              style={{ left: pct(a), width: `calc(${pct(b)} - ${pct(a)} - 2px)`, background: COLORS[p.companyId] }}
              title={`${text?.title} · ${formatPeriod(p.period, locale, c.ui.present)}`}
            />
          );
        })}
      </div>
      <div className={styles.years} aria-hidden="true">
        {Array.from({ length: 11 }, (_, i) => (
          <span key={i} style={{ left: pct(months(String(2010 + i))) }}>
            {2010 + i}
          </span>
        ))}
      </div>
      <ul className={styles.legend}>
        {automotiveCompanies.map((co) => (
          <li key={co.id}>
            <i style={{ background: COLORS[co.id] }} />
            {co.shortName} · {formatPeriod(co.period, locale, c.ui.present)}
          </li>
        ))}
      </ul>
    </figure>
  );
}

function Overview() {
  const c = useContent();
  const locale = useExperience((s) => s.locale);
  const open = useExperience((s) => s.openAutoSection);
  return (
    <div>
      <h1>{c.automotive.heading}</h1>
      <p className={styles.lead}>{c.automotive.portfolio.overviewIntro}</p>
      <Timeline />
      <ul className={styles.cards}>
        {[...automotiveCompanies]
          .sort((a, b) => months(b.period.start) - months(a.period.start))
          .map((co) => (
            <li key={co.id}>
              <button type="button" className={styles.card} onClick={() => open(co.id as AutoSection)} style={{ borderTopColor: COLORS[co.id] }}>
                <Logo company={co} />
                <strong>{co.name}</strong>
                <span>{formatPeriod(co.period, locale, c.ui.present)}</span>
                <span className={styles.cardRoles}>
                  {[...new Set(automotivePositions.filter((p) => p.companyId === co.id).map((p) => c.automotive.positions[p.id]?.title))].join(' · ')}
                </span>
                <span className={styles.open}>{c.automotive.portfolio.openCompany} →</span>
              </button>
            </li>
          ))}
      </ul>
    </div>
  );
}

function CompanySection({ id }: { id: string }) {
  const c = useContent();
  const locale = useExperience((s) => s.locale);
  const co = automotiveCompanies.find((x) => x.id === id)!;
  const p = c.automotive.portfolio;
  const desc = c.automotive.companies[id]?.description;
  const highlight = c.automotive.highlights[id];
  const positions = automotivePositions.filter((x) => x.companyId === id);
  return (
    <div>
      <header className={styles.companyHeader}>
        <Logo company={co} />
        <div>
          <h1>{co.name}</h1>
          <p className={styles.lead}>{formatPeriod(co.period, locale, c.ui.present)}</p>
        </div>
      </header>
      {desc && <p className={styles.desc}>{desc}</p>}
      <fieldset className={styles.group}>
        <legend>{p.positions}</legend>
        <ul className={styles.positions}>
          {positions.map((pos) => {
            const t = c.automotive.positions[pos.id];
            return (
              <li key={pos.id}>
                <strong>{t?.title}</strong>
                <span>
                  {formatPeriod(pos.period, locale, c.ui.present)} · {id === 'rfea' ? p.venues.join(' · ') : t?.location}
                </span>
              </li>
            );
          })}
        </ul>
      </fieldset>
      {id === 'rfea' && (
        <fieldset className={styles.group}>
          <legend>{p.locations}</legend>
          <ul className={styles.chips}>
            {p.venues.map((v) => (
              <li key={v}>{v}</li>
            ))}
          </ul>
        </fieldset>
      )}
      {highlight && (
        <fieldset className={styles.group}>
          <legend>{highlight.label}</legend>
          <ul className={styles.chips}>
            {highlight.items.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </fieldset>
      )}
      {co.technologies.length > 0 && (
        <fieldset className={styles.group}>
          <legend>{c.automotive.labels.technologies}</legend>
          <ul className={styles.chips}>
            {co.technologies.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </fieldset>
      )}
    </div>
  );
}

function Technologies() {
  const c = useContent();
  const p = c.automotive.portfolio;
  return (
    <div>
      <h1>{p.sections.technologies}</h1>
      <p className={styles.lead}>{p.technologiesIntro}</p>
      {automotiveCompanies
        .filter((co) => co.technologies.length)
        .map((co) => (
          <fieldset key={co.id} className={styles.group}>
            <legend>
              {p.techAt} {co.name}
            </legend>
            <ul className={styles.chips}>
              {co.technologies.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </fieldset>
        ))}
    </div>
  );
}

const VIEWS: Record<AutoSection, () => React.JSX.Element> = {
  overview: Overview,
  nissan: () => <CompanySection id="nissan" />,
  seat: () => <CompanySection id="seat" />,
  rfea: () => <CompanySection id="rfea" />,
  technologies: Technologies,
};

export function AutoPortfolio({ mode }: { mode: 'screen' | 'sheet' }) {
  const c = useContent();
  const p = c.automotive.portfolio;
  const locale = useExperience((s) => s.locale);
  const section = useExperience((s) => s.auto.section);
  const open = useExperience((s) => s.openAutoSection);
  const close = () => useExperience.getState().goTo('teslaInterior');
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    navRef.current?.focus({ preventScroll: true });
  }, []);

  const onNavKey = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const i = AUTO_SECTIONS.indexOf(section);
    open(AUTO_SECTIONS[(i + (e.key === 'ArrowDown' ? 1 : -1) + AUTO_SECTIONS.length) % AUTO_SECTIONS.length]!);
    requestAnimationFrame(() => navRef.current?.querySelector<HTMLButtonElement>('[aria-current="true"]')?.focus());
  };

  const View = VIEWS[section];
  return (
    <div className={`${styles.desktop} ${mode === 'sheet' ? styles.sheet : styles.screen}`} lang={locale}>
      <div className={styles.window}>
        <header className={styles.titleBar}>
          <span>{c.automotive.windowTitle}</span>
          <div className={styles.controls}>
            <span aria-hidden="true">_</span>
            <span aria-hidden="true">□</span>
            <button type="button" className={styles.closeBtn} aria-label={p.closePortfolio} title={p.closePortfolio} onClick={close}>
              ×
            </button>
          </div>
        </header>
        <div className={styles.body}>
          <nav ref={navRef} className={styles.pane} aria-label={p.navLabel} tabIndex={-1} onKeyDown={onNavKey}>
            <div className={styles.paneBox}>
              <span className={styles.paneTitle}>{c.automotive.subtitle}</span>
              {AUTO_SECTIONS.map((id) => (
                <button key={id} type="button" className={styles.paneItem} aria-current={section === id} onClick={() => open(id)}>
                  {p.sections[id]}
                </button>
              ))}
            </div>
          </nav>
          <main className={styles.content} key={section}>
            <View />
          </main>
        </div>
      </div>
      <footer className={styles.taskbar} aria-hidden="true">
        <span className={styles.start}>{p.start}</span>
        <span className={styles.task}>{c.automotive.windowTitle}</span>
        <span className={styles.clock}>{c.windows.clock}</span>
      </footer>
    </div>
  );
}
