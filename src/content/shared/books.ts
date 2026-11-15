import type { BookRecord } from '../types';

/**
 * The personal library. Deliberately unsorted (spec §9): `place` is a fixed, hand-picked
 * position on the shelf, not derived from genre or title. The three catalogue books sit at
 * eye level in the middle bays so they are easy to find.
 * Covers: /public/books/, from Open Library (editions and sources in docs/ASSETS.md).
 * Subtitles are those of the selected Open Library editions; `firstPublished` is the Open Library
 * work's first-publish year (Sapiens: OL17075811W, Dinosaurs: OL20152885W, Emperor: OL15540668W).
 */
export const books: BookRecord[] = [
  {
    id: 'sapiens',
    title: 'Sapiens',
    subtitle: 'A Brief History of Humankind',
    // Spec wrote "Arari (to verify)"; the published author name is Yuval Noah Harari.
    author: 'Yuval Noah Harari',
    firstPublished: 2011,
    spine: { color: '#e9e4d8', textColor: '#b3261e', heightCm: 23.4, thicknessCm: 3.4 },
    cover: 'books/sapiens.jpg',
    place: { shelf: 3, bay: 1, at: 0.35 },
  },
  {
    id: 'dinosaurs',
    title: 'The Rise and Fall of the Dinosaurs',
    subtitle: 'A New History of Their Lost World',
    author: 'Steve Brusatte',
    firstPublished: 2018,
    spine: { color: '#1f3b4d', textColor: '#e8c26a', heightCm: 24.0, thicknessCm: 3.0 },
    cover: 'books/dinosaurs.jpg',
    place: { shelf: 4, bay: 2, at: 0.6 },
  },
  {
    id: 'emperor-maladies',
    title: 'The Emperor of All Maladies',
    subtitle: 'A Biography of Cancer',
    author: 'Siddhartha Mukherjee',
    firstPublished: 2010,
    spine: { color: '#f2efe6', textColor: '#1a1a1a', heightCm: 23.5, thicknessCm: 4.2 },
    cover: 'books/emperor-maladies.jpg',
    place: { shelf: 3, bay: 2, at: 0.15 },
  },
];
