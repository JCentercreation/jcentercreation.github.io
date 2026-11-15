import { useEffect, useState } from 'react';
import { useExperience } from '@/app/store';
import { useContent } from '@/app/useContent';
import styles from './Loader.module.css';

export type LoadStage = 'engine' | 'scene' | 'ready';

interface Props {
  stage: LoadStage;
  /** Real asset progress (0–100) from three's loading manager, or null when nothing measurable is loading. */
  progress: number | null;
  done: boolean;
}

/**
 * Minimal loader. Shows real stages (engine download → scene preparation); a percentage only when
 * three's loading manager reports genuine asset progress. Otherwise the bar is indeterminate.
 */
export function Loader({ stage, progress, done }: Props) {
  const { ui } = useContent();
  const pct = progress === null ? null : Math.round(progress);
  // If starting takes unusually long (slow GPU/network), offer the simple version — never a dead end.
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (done) return;
    const t = window.setTimeout(() => setSlow(true), 15000);
    return () => window.clearTimeout(t);
  }, [done]);
  return (
    <div className={`${styles.loader} ${done ? styles.hidden : ''}`} aria-hidden={done}>
      <div className={styles.glow} />
      <div className={styles.inner} role="status" aria-live="polite">
        <p className={styles.title}>{ui.siteTitle}</p>
        <p className={styles.hint}>{ui.loadingStages[stage]}</p>
        <div
          className={`${styles.track} ${pct === null ? styles.indeterminate : ''}`}
          role="progressbar"
          aria-label={ui.loading}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct ?? undefined}
          aria-valuetext={pct === null ? ui.loadingStages[stage] : undefined}
        >
          <div className={styles.bar} style={pct === null ? undefined : { transform: `scaleX(${pct / 100})` }} />
        </div>
        {pct !== null && <div className={styles.percent}>{pct}%</div>}
        {slow && !done && (
          <p className={styles.slow}>
            <button type="button" onClick={() => useExperience.getState().setForceFallback('chosen')}>
              {ui.loadError.continue2d}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
