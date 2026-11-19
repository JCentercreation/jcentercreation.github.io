import { useExperience } from '@/app/store';
import { useContent } from '@/app/useContent';
import { useNarrowViewport } from '@/lib/useViewport';
import styles from './IntroCaption.module.css';

/**
 * Welcome note as an understated caption during the intro, on screens where the MacBook's own
 * screen is too small to read in the close-up (phones / portrait). On wider screens the note is
 * read directly on the MacBook. It stays up while the camera starts pulling back and fades during the
 * first part of the move, so the note and the reveal read as one continuous sequence (on the MacBook the
 * note likewise stays legible through the slow start of the pull-back). Skip hides it at once.
 */
export function IntroCaption() {
  const { welcome, ui } = useContent();
  const narrow = useNarrowViewport();
  const intro = useExperience((s) => s.phase === 'intro');
  const revealing = useExperience((s) => s.introRevealing);
  const skipped = useExperience((s) => s.skipIntroRequested);
  if (!narrow || !intro) return null;
  return (
    <section className={styles.caption} data-visible={!revealing && !skipped} data-leaving={skipped ? 'skip' : 'reveal'} aria-label={ui.welcomeLabel} aria-live="polite">
      {welcome.body.map((p) => (
        <p key={p}>{p}</p>
      ))}
    </section>
  );
}
