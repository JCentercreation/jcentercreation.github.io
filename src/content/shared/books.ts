import type { BookRecord } from '../types';

/**
 * The personal library. Deliberately unsorted (spec §9): `slot` is a fixed, hand-picked
 * position on the shelf, not derived from genre or title.
 * Covers go in /public/books/ once supplied.
 */
export const books: BookRecord[] = [
  {
    id: 'sapiens',
    title: 'Sapiens',
    // Spec wrote "Arari (to verify)"; the published author name is Yuval Noah Harari.
    author: 'Yuval Noah Harari',
    spine: { color: '#e9e4d8', textColor: '#b3261e', heightCm: 23.4, thicknessCm: 3.4 },
    cover: null,
    slot: 7,
  },
  {
    id: 'dinosaurs',
    title: 'The Rise and Fall of the Dinosaurs',
    author: 'Steve Brusatte',
    spine: { color: '#1f3b4d', textColor: '#e8c26a', heightCm: 24.0, thicknessCm: 3.0 },
    cover: null,
    slot: 19,
  },
  {
    id: 'emperor-maladies',
    title: 'The Emperor of All Maladies',
    author: 'Siddhartha Mukherjee',
    spine: { color: '#f2efe6', textColor: '#1a1a1a', heightCm: 23.5, thicknessCm: 4.2 },
    cover: null,
    slot: 31,
  },
];
