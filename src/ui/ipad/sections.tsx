import {
  IPAD_SECTIONS,
  appleCompanies,
  architecturePatterns,
  iosTechnologies,
  leadershipContext,
  type CompanyRecord,
} from '@/content';
import { useExperience } from '@/app/store';
import { useContent } from '@/app/useContent';
import { formatPeriod } from '@/lib/format';
import styles from './CareerApp.module.css';

/** iPad sections. Data from the content layer (shared with the MacBook), state from the store. */

export function CompanyLogo({ company }: { company: CompanyRecord }) {
  return company.logo ? (
    <span className={styles.logo}>
      <img src={`${import.meta.env.BASE_URL}${company.logo}`} alt="" />
    </span>
  ) : (
    // Placeholder until the official file is supplied — never a fake logo.
    <span className={`${styles.logo} ${styles.logoPending}`}>{company.shortName}</span>
  );
}

function Header({ id }: { id: (typeof IPAD_SECTIONS)[number] }) {
  const { ipad } = useContent();
  return (
    <header className={styles.sectionHeader}>
      <h1>{ipad.sections[id].title}</h1>
      <p>{ipad.sections[id].intro}</p>
    </header>
  );
}

export function Home() {
  const { ipad } = useContent();
  const open = useExperience((s) => s.openIPadSection);
  return (
    <div>
      <p className={styles.eyebrow}>{ipad.home.eyebrow}</p>
      <h1 className={styles.hero}>{ipad.home.title}</h1>
      <p className={styles.heroSub}>{ipad.home.subtitle}</p>
      <ul className={styles.homeGrid}>
        {IPAD_SECTIONS.map((id, i) => (
          <li key={id}>
            <button type="button" className={styles.homeCard} onClick={() => open(id)}>
              <span className={styles.index}>{String(i + 1).padStart(2, '0')}</span>
              <strong>{ipad.sections[id].title}</strong>
              <span>{ipad.sections[id].intro}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Timeline() {
  const c = useContent();
  const locale = useExperience((s) => s.locale);
  const selected = useExperience((s) => s.ipad.company);
  const select = useExperience((s) => s.selectIPadCompany);
  const today = new Date();
  const now = today.getFullYear() + today.getMonth() / 12;
  const start = 2020;
  const end = Math.ceil(now);
  const pct = (y: number) => ((y - start) / (end - start)) * 100;
  const company = appleCompanies.find((co) => co.id === selected);
  const text = company ? c.apple.companies[company.id] : null;

  return (
    <div className={styles.timelineLayout} data-detail={!!company}>
      <div>
        <Header id="timeline" />
        <div className={styles.lanes} role="list">
          {appleCompanies.map((co) => {
            const a = Number(co.period.start.slice(0, 4));
            const b = co.period.end ? Number(co.period.end.slice(0, 4)) + 1 : now;
            return (
              <div key={co.id} className={styles.lane} role="listitem">
                <span className={styles.laneLabel}>{co.shortName}</span>
                <span className={styles.laneTrack}>
                  <button
                    type="button"
                    className={styles.laneBar}
                    aria-pressed={selected === co.id}
                    style={{ left: `${pct(a)}%`, width: `${pct(b) - pct(a)}%` }}
                    onClick={() => select(selected === co.id ? null : co.id)}
                  >
                    <span>{co.name}</span>
                    <span className="visually-hidden">, {formatPeriod(co.period, locale, c.ui.present)}</span>
                  </button>
                </span>
              </div>
            );
          })}
        </div>
        <div className={styles.axis} aria-hidden="true">
          {Array.from({ length: end - start + 1 }, (_, i) => (
            <span key={i} style={{ left: `${pct(start + i)}%` }}>
              {start + i}
            </span>
          ))}
        </div>
        {!company && <p className={styles.hint}>{c.ipad.labels.selectHint} ↑</p>}
      </div>

      {company && text && (
        <aside className={styles.detail} aria-live="polite">
          <button type="button" className={styles.detailClose} aria-label={c.ipad.labels.closeDetail} onClick={() => select(null)}>
            ✕
          </button>
          <CompanyLogo company={company} />
          <h2>{company.name}</h2>
          <dl>
            <dt>{c.ipad.labels.role}</dt>
            <dd>{text.role}</dd>
            <dt>{c.ipad.labels.period}</dt>
            <dd>{formatPeriod(company.period, locale, c.ui.present)}</dd>
          </dl>
          <p>{text.description}</p>
        </aside>
      )}
    </div>
  );
}

export function IOSEngineering() {
  const { ipad } = useContent();
  return (
    <div>
      <Header id="ios" />
      {(['languages', 'uiFrameworks'] as const).map((group) => (
        <section key={group} className={styles.techGroup}>
          <h2 className={styles.groupLabel}>{ipad.ios[group]}</h2>
          <ul className={styles.techGrid}>
            {iosTechnologies
              .filter((t) => t.group === group)
              .map((t) => (
                <li key={t.id} className={`${styles.techTile} ${styles[`tech_${t.id}`]}`}>
                  <span>{t.name}</span>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function Architecture() {
  const { ipad } = useContent();
  return (
    <div>
      <Header id="architecture" />
      <ul className={styles.patternRow} aria-label={ipad.sections.architecture.title}>
        {architecturePatterns.map((p) => (
          <li key={p.id}>{p.name}</li>
        ))}
      </ul>
      <h2 className={styles.groupLabel}>{ipad.labels.generalOverview}</h2>
      <p className={styles.note}>{ipad.labels.generalNote}</p>
      <ul className={styles.patternGrid}>
        {architecturePatterns.map((p) => (
          <li key={p.id} className={styles.patternCard}>
            <strong>{p.name}</strong>
            <em>{ipad.architecture.patterns[p.id].expansion}</em>
            <span>{ipad.architecture.patterns[p.id].summary}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Practices() {
  const { ipad } = useContent();
  return (
    <div>
      <Header id="practices" />
      <div className={styles.practiceGrid}>
        {Object.values(ipad.practices).map((g) => (
          <section key={g.label} className={styles.practiceCard}>
            <h2>{g.label}</h2>
            <ul>
              {g.items.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

export function Leadership() {
  const c = useContent();
  const select = useExperience((s) => s.selectIPadCompany);
  const open = useExperience((s) => s.openIPadSection);
  return (
    <div>
      <Header id="leadership" />
      <ul className={styles.leadList}>
        {leadershipContext.map((item) => (
          <li key={item.id} className={styles.leadRow}>
            <strong>{c.ipad.leadership.items[item.id]}</strong>
            <span className={styles.leadContext}>
              <span className={styles.leadLabel}>{c.ipad.labels.context}</span>
              {item.companies.map((id) => {
                const co = appleCompanies.find((x) => x.id === id)!;
                return (
                  <button
                    key={id}
                    type="button"
                    className={styles.leadChip}
                    onClick={() => {
                      open('timeline');
                      select(id);
                    }}
                  >
                    {co.name} · {c.apple.companies[id]?.role}
                  </button>
                );
              })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
