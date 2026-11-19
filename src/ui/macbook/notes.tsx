import { appleCompanies, contactLinks, projects, type CompanyRecord } from '@/content';
import { useExperience } from '@/app/store';
import { useContent } from '@/app/useContent';
import { formatPeriod } from '@/lib/format';
import { ExternalLink, ownerLink, websiteText } from '../ExternalLink';
import styles from './Portfolio.module.css';

/** The individual notes (portfolio sections). Pure presentation: data from content, state from the store. */

export function WelcomeNote() {
  const c = useContent();
  const openSection = useExperience((s) => s.openSection);
  return (
    <article>
      <h1>{c.welcome.title}</h1>
      {c.welcome.body.map((p) => (
        <p key={p}>{p}</p>
      ))}
      <h2>{c.welcome.discover.heading}</h2>
      <ul className={styles.bullets}>
        {c.welcome.discover.items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
      <button type="button" className={styles.primary} onClick={() => openSection('about')}>
        {c.macbook.labels.explore} →
      </button>
    </article>
  );
}

export function AboutNote() {
  const { macbook, contact } = useContent();
  return (
    <article>
      <h1>{macbook.about.heading}</h1>
      <h2>{macbook.about.combinesLabel}</h2>
      <ul className={styles.checklist}>
        {macbook.about.combines.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
      {macbook.about.paragraphs.map((p) => (
        <p key={p}>{p}</p>
      ))}
      <h2>{contact.heading}</h2>
      <ul className={styles.links}>
        {contactLinks.map((id) => (
          <li key={id}>
            <ExternalLink href={ownerLink(id)} newTab={macbook.labels.opensInNewTab}>
              {contact.links[id]}
            </ExternalLink>
          </li>
        ))}
      </ul>
    </article>
  );
}

function Logo({ company }: { company: CompanyRecord }) {
  if (company.logo)
    return (
      <span className={styles.logo}>
        <img src={`${import.meta.env.BASE_URL}${company.logo}`} alt="" />
      </span>
    );
  // Placeholder until an official file is supplied — never a fake logo.
  return <span className={`${styles.logo} ${styles.logoPending}`}>{company.shortName}</span>;
}

function Timeline() {
  const c = useContent();
  const today = new Date();
  // "Present" runs to today; the axis ends at the next full year.
  const now = today.getFullYear() + today.getMonth() / 12;
  const start = 2020;
  const span = Math.ceil(now) - start;
  const pct = (y: number) => `${((y - start) / span) * 100}%`;
  return (
    <figure className={styles.timeline} aria-label={c.macbook.experience.timeline}>
      <figcaption>{c.macbook.experience.timeline}</figcaption>
      <div className={styles.timelineRows}>
        {appleCompanies.map((co) => {
          const a = Number(co.period.start.slice(0, 4));
          const b = co.period.end ? Number(co.period.end.slice(0, 4)) + 1 : now;
          return (
            <div key={co.id} className={styles.timelineRow}>
              <span className={styles.timelineName}>{co.shortName}</span>
              <span className={styles.timelineTrack}>
                <span className={styles.timelineBar} style={{ left: pct(a), width: `calc(${pct(b)} - ${pct(a)})` }} />
              </span>
            </div>
          );
        })}
      </div>
      <div className={styles.timelineYears} aria-hidden="true">
        {Array.from({ length: span + 1 }, (_, i) => (
          <span key={i} style={{ left: pct(start + i) }}>
            {start + i}
          </span>
        ))}
      </div>
    </figure>
  );
}

export function ExperienceNote() {
  const c = useContent();
  const locale = useExperience((s) => s.locale);
  const open = useExperience((s) => s.portfolio.company);
  const toggle = useExperience((s) => s.toggleCompany);
  const e = c.macbook.experience;
  return (
    <article>
      <h1>{e.heading}</h1>
      <p className={styles.lead}>{e.intro}</p>
      <Timeline />
      <ul className={styles.companies}>
        {appleCompanies.map((co) => {
          const expanded = open === co.id;
          const text = c.apple.companies[co.id];
          const desc = text?.description;
          const role = text?.role;
          const period = formatPeriod(co.period, locale, c.ui.present);
          return (
            <li key={co.id}>
              <button type="button" className={styles.company} aria-expanded={expanded} aria-controls={`co-${co.id}`} onClick={() => toggle(co.id)}>
                <Logo company={co} />
                <span className={styles.companyText}>
                  <strong>{co.name}</strong>
                  <span>{role ? `${role} · ${period}` : period}</span>
                </span>
                <span className={styles.chevron} aria-hidden="true">
                  {expanded ? '−' : '+'}
                </span>
                <span className="visually-hidden">{expanded ? e.hideDetails : e.showDetails}</span>
              </button>
              {expanded && (
                <dl id={`co-${co.id}`} className={styles.companyDetail}>
                  <dt>{e.role}</dt>
                  <dd className={role ? undefined : styles.pending}>{role ?? e.rolePending}</dd>
                  <dt>{e.period}</dt>
                  <dd>{period}</dd>
                  <dt>{e.description}</dt>
                  <dd className={desc ? undefined : styles.pending}>{desc ?? c.ui.pendingContent}</dd>
                  {co.website && (
                    <>
                      <dt>{c.contact.website}</dt>
                      <dd>
                        <ExternalLink href={ownerLink(co.website)} newTab={c.macbook.labels.opensInNewTab}>
                          {websiteText(c, co)}
                        </ExternalLink>
                      </dd>
                    </>
                  )}
                </dl>
              )}
            </li>
          );
        })}
      </ul>
      <section className={styles.callout}>
        <h2>{c.apple.startups.heading}</h2>
        <p>{c.apple.startups.intro}</p>
        {appleCompanies
          .filter((co) => co.website)
          .map((co) => (
            <p key={co.id}>
              <ExternalLink href={ownerLink(co.website!)} newTab={c.macbook.labels.opensInNewTab}>
                {websiteText(c, co)}
              </ExternalLink>
            </p>
          ))}
      </section>
    </article>
  );
}

export function SkillsNote() {
  const { macbook } = useContent();
  return (
    <article>
      <h1>{macbook.skills.heading}</h1>
      {Object.values(macbook.skills.groups).map((g) => (
        <section key={g.label} className={styles.skillGroup}>
          <h2>{g.label}</h2>
          <ul className={styles.chips}>
            {g.items.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </section>
      ))}
    </article>
  );
}

export function ProjectsNote() {
  const c = useContent();
  const selected = useExperience((s) => s.portfolio.project);
  const openProject = useExperience((s) => s.openProject);
  const m = c.macbook;
  const project = projects.find((p) => p.id === selected);

  if (project) {
    const text = m.projects[project.id];
    const links = project.links ?? [{ name: project.name, url: project.url }];
    return (
      <article>
        <button type="button" className={styles.back} onClick={() => openProject(null)}>
          ← {m.labels.backToProjects}
        </button>
        <h1>{project.name}</h1>
        {text?.status && (
          <p className={styles.status}>
            <span>{m.labels.status}:</span> {text.status}
          </p>
        )}
        <p>{text?.description}</p>
        <h2>{m.labels.links}</h2>
        <ul className={styles.links}>
          {links.map((l) => (
            <li key={l.url}>
              <a href={l.url} target="_blank" rel="noopener noreferrer">
                {l.name} ↗<span className="visually-hidden"> ({m.labels.opensInNewTab})</span>
              </a>
            </li>
          ))}
        </ul>
      </article>
    );
  }

  return (
    <article>
      <h1>{m.projectsHeading}</h1>
      <p className={styles.lead}>{m.projectsIntro}</p>
      <ul className={styles.projectGrid}>
        {projects.map((p) => {
          const text = m.projects[p.id];
          return (
            <li key={p.id}>
              <button type="button" className={styles.projectCard} onClick={() => openProject(p.id)}>
                <strong>{p.name}</strong>
                <span>{text?.description}</span>
                {text?.status && <em>{text.status}</em>}
              </button>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
