import { useEffect, useRef } from 'react';
import { books } from '@/content';
import { useExperience } from '@/app/store';
import { useContent } from '@/app/useContent';
import styles from './Hud.module.css';

/** Small label that follows the mouse over interactive objects (mouse only; touch has no hover). */
export function Tooltip() {
  const { ui, books: bookText } = useContent();
  const hovered = useExperience((s) => s.hovered);
  const hoveredBook = useExperience((s) => s.hoveredBook);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (ref.current) ref.current.style.transform = `translate(${e.clientX + 16}px, ${e.clientY + 18}px)`;
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  const book = hoveredBook ? books.find((b) => b.id === hoveredBook) : null;
  const label = book ? `${book.title} — ${bookText.byAuthor} ${book.author}` : hovered ? ui.objects[hovered] : null;

  return (
    <div ref={ref} className={styles.tooltip} data-visible={!!label} aria-hidden="true">
      {label}
    </div>
  );
}
