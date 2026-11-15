import { useEffect, useRef } from 'react';
import { books } from '@/content';
import { useExperience } from '@/app/store';
import { useContent } from '@/app/useContent';
import styles from './BookPanel.module.css';

/**
 * Bookshelf DOM layer:
 * - an understated hint once the camera has arrived at the shelf,
 * - a keyboard-reachable list of the catalogue books (hidden until focused, like the places nav),
 * - the info card beside the book once it has turned towards the camera.
 * Titles and authors are always shown in their original published language.
 */
export function BookPanel() {
  const c = useContent();
  const atShelf = useExperience((s) => s.shot === 'bookshelf' && s.arrivedShot === 'bookshelf' && s.phase === 'exploring');
  const selected = useExperience((s) => s.selectedBook);
  const held = useExperience((s) => s.bookHeld);
  const selectBook = useExperience((s) => s.selectBook);
  const closeBook = useExperience((s) => s.closeBook);
  const closeRef = useRef<HTMLButtonElement>(null);
  const book = books.find((b) => b.id === selected);

  // Move focus to "Put the book back" when the card appears (keyboard users can close with Enter or Escape).
  useEffect(() => {
    if (held) closeRef.current?.focus({ preventScroll: true });
  }, [held]);

  if (!atShelf) return null;
  const description = book ? c.books.descriptions[book.id] : null;

  return (
    <>
      <p className={styles.hint} data-visible={!selected} aria-hidden={!!selected}>
        {c.books.selectHint}
      </p>

      <nav className={styles.list} aria-label={c.books.listLabel}>
        {books.map((b) => (
          <button key={b.id} type="button" disabled={!!selected} onClick={() => selectBook(b.id)} lang="en">
            {b.title} — {b.author}
          </button>
        ))}
      </nav>

      {book && (
        <aside className={styles.card} data-visible={held} aria-hidden={!held} aria-live="polite">
          <h2 lang="en">{book.title}</h2>
          {book.subtitle && (
            <p className={styles.subtitle} lang="en">
              {book.subtitle}
            </p>
          )}
          <p className={styles.author}>
            {c.books.byAuthor} <span lang="en">{book.author}</span>
          </p>
          {description && <p className={styles.description}>{description}</p>}
          {book.firstPublished && (
            <p className={styles.meta}>
              {c.books.firstPublished}: {book.firstPublished}
            </p>
          )}
          <button ref={closeRef} type="button" className={styles.close} onClick={closeBook} tabIndex={held ? 0 : -1}>
            {c.books.close}
          </button>
        </aside>
      )}
    </>
  );
}
