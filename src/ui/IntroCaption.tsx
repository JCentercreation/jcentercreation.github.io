import { useExperience } from '@/app/store';
import { useContent } from '@/app/useContent';
import { useNarrowViewport } from '@/lib/useViewport';
import styles from './IntroCaption.module.css';

/**
 * Welcome note as an understated caption during the intro, on screens where the MacBook's own
 * screen is too small to read in the close-up (phones / portrait). On wider screens the note is
 * read directly on the MacBook. Fades out when the camera starts pulling back.
 */
export function IntroCaption() {
  const { welcome, ui } = useContent();
  const narrow = useNarrowViewport();
  const intro = useExperience((s) => s.phase === 'intro');
  const revealing = useExperience((s) => s.introRevealing || s.skipIntroRequested);
  if (!narrow || !intro) return null;
  return (
    <section className={styles.caption} data-visible={!revealing} aria-label={ui.welcomeLabel} aria-live="polite">
      {welcome.body.map((p) => (
        <p key={p}>{p}</p>
      ))}
    </section>
  );
}
