import { useEffect } from 'react';
import { appleCompanies, automotiveCompanies, automotivePositions, books, projects } from '@/content';
import { useExperience } from '@/app/store';
import { useContent } from '@/app/useContent';
import { formatPeriod } from '@/lib/format';
import styles from './Fallback.module.css';

/**
 * Content-first 2D version for devices without WebGL2 (spec §13).
 * Everything here comes from the content layer, so it stays in sync with the 3D screens.
 */
export function Fallback({ canTry3D }: { canTry3D: boolean }) {
  const c = useContent();
  const locale = useExperience((s) => s.locale);
  const setForceScene = useExperience((s) => s.setForceScene);

  useEffect(() => {
    document.body.classList.add('scrollable');
    return () => document.body.classList.remove('scrollable');
  }, []);

  const period = (p: Parameters<typeof formatPeriod>[0]) => formatPeriod(p, locale, c.ui.present);

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.notice} role="note">
          {c.ui.fallback.reason}
          {canTry3D && (
            <div>
              <button type="button" onClick={() => setForceScene(true)}>
                {c.ui.fallback.viewAnyway}
              </button>
            </div>
          )}
        </div>

        <h1>{c.welcome.title}</h1>
        {c.welcome.body.map((p) => (
          <p key={p}>{p}</p>
        ))}

        <h2>{c.apple.heading}</h2>
        <div className={styles.cards}>
          {appleCompanies.map((co) => (
            <article key={co.id} className={styles.card}>
              <h3>{co.name}</h3>
              <p className={styles.meta}>{period(co.period)}</p>
              <p className={c.apple.companies[co.id]?.description ? undefined : styles.muted}>
                {c.apple.companies[co.id]?.description ?? c.ui.pendingContent}
              </p>
            </article>
          ))}
          <article className={styles.card}>
            <h3>{c.apple.startups.heading}</h3>
            <p>{c.apple.startups.intro}</p>
          </article>
        </div>

        <h2>{c.apple.sections.technologies}</h2>
        <div className={styles.profile}>
          {Object.values(c.apple.profile).map((group) => (
            <div key={group.label}>
              <h3>{group.label}</h3>
              <ul className={styles.chips}>
                {group.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <h2>{c.automotive.heading}</h2>
        <p className={styles.muted}>{c.automotive.subtitle}</p>
        <div className={styles.cards}>
          {automotiveCompanies.map((co) => {
            const text = c.automotive.companies[co.id];
            const highlight = c.automotive.highlights[co.id];
            return (
              <article key={co.id} className={styles.card}>
                <h3>{co.name}</h3>
                <p className={styles.meta}>{period(co.period)}</p>
                <ul className={styles.positions}>
                  {automotivePositions
                    .filter((p) => p.companyId === co.id)
                    .map((p) => (
                      <li key={p.id}>
                        <strong>{c.automotive.positions[p.id]?.title}</strong>
                        <div className={styles.meta}>
                          {period(p.period)} · {c.automotive.positions[p.id]?.location}
                        </div>
                      </li>
                    ))}
                </ul>
                <p className={text?.description ? undefined : styles.muted}>
                  {text?.description ?? c.ui.pendingContent}
                </p>
                {highlight && (
                  <ul className={styles.chips} aria-label={highlight.label}>
                    {highlight.items.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                )}
                {co.technologies.length > 0 && (
                  <ul className={styles.chips} aria-label={c.automotive.labels.technologies}>
                    {co.technologies.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                )}
              </article>
            );
          })}
        </div>

        <h2>{c.macbook.projectsHeading}</h2>
        <div className={styles.cards}>
          {projects.map((p) => (
            <article key={p.id} className={styles.card}>
              <h3>
                <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
                  {p.name} ↗
                </a>
              </h3>
              {c.macbook.projects[p.id]?.status && <p className={styles.meta}>{c.macbook.projects[p.id]?.status}</p>}
              <p>{c.macbook.projects[p.id]?.description}</p>
            </article>
          ))}
        </div>

        <h2>{c.books.heading}</h2>
        <div className={styles.cards}>
          {books.map((b) => (
            <article key={b.id} className={styles.card}>
              <h3>{b.title}</h3>
              <p className={styles.meta}>
                {c.books.byAuthor} {b.author}
              </p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
