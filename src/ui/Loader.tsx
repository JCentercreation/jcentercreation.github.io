import { useContent } from '@/app/useContent';
import styles from './Loader.module.css';

interface Props {
  /** 0–100 */
  progress: number;
  done: boolean;
}

export function Loader({ progress, done }: Props) {
  const { ui } = useContent();
  const pct = Math.round(progress);
  return (
    <div className={`${styles.loader} ${done ? styles.hidden : ''}`} aria-hidden={done}>
      <div className={styles.glow} />
      <div className={styles.inner} role="status" aria-live="polite">
        <p className={styles.title}>{ui.siteTitle}</p>
        <p className={styles.hint}>{ui.loadingHint}</p>
        <div
          className={styles.track}
          role="progressbar"
          aria-label={ui.loading}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
        >
          <div className={styles.bar} style={{ transform: `scaleX(${pct / 100})` }} />
        </div>
        <div className={styles.percent}>{pct}%</div>
      </div>
    </div>
  );
}
