import type { CompanyRecord, PositionRecord } from '../types';

/**
 * Logos: official files in /public/logos/ (sources and terms in docs/ASSETS.md).
 * They are drawn preserving their original proportions and colours. Left `null` until the owner
 * supplies them (spec §8.4); screens then show a clearly marked placeholder, never a fake logo.
 * Still pending: Misfits Studio and RFEDA (no suitable official SVG obtainable yet).
 */

export const appleCompanies: CompanyRecord[] = [
  { id: 'sabadell', logo: 'logos/sabadell.svg', shortName: 'Sabadell', name: 'Banc Sabadell', period: { start: '2020', end: '2021' }, technologies: [] },
  { id: 'misfits', shortName: 'Misfits', name: 'Misfits Studio', logo: null, period: { start: '2020', end: null }, technologies: [] },
  { id: 'inditex', logo: 'logos/inditex.svg', shortName: 'Inditex', name: 'Inditex', period: { start: '2023', end: '2024' }, technologies: [] },
  { id: 'santander', logo: 'logos/santander.svg', shortName: 'Santander', name: 'Banco Santander', period: { start: '2024', end: '2025' }, technologies: [] },
];

export const automotiveCompanies: CompanyRecord[] = [
  {
    id: 'nissan',
    shortName: 'Nissan',
    name: 'Nissan Motor Corporation',
    logo: 'logos/nissan.svg',
    period: { start: '2016-09', end: '2018-08' },
    technologies: ['C++', 'C'],
  },
  {
    id: 'seat',
    shortName: 'SEAT',
    name: 'SEAT, S.A.',
    logo: 'logos/seat.svg',
    period: { start: '2018-10', end: '2019-11' },
    technologies: ['Clean Coding', 'Git'],
  },
  {
    id: 'rfea',
    shortName: 'RFEDA',
    name: 'Real Federación Española de Automovilismo (RFEDA)',
    logo: null,
    period: { start: '2010-04', end: '2012-06' },
    technologies: [],
  },
];

export const automotivePositions: PositionRecord[] = [
  { id: 'nissan-etb-bcn', companyId: 'nissan', period: { start: '2016-09', end: '2017-02' } },
  { id: 'nissan-etb-cranfield', companyId: 'nissan', period: { start: '2017-02', end: '2017-04' } },
  { id: 'nissan-performance', companyId: 'nissan', period: { start: '2017-04', end: '2018-08' } },
  { id: 'seat-swe', companyId: 'seat', period: { start: '2018-10', end: '2019-11' } },
  { id: 'rfea-scrutineer', companyId: 'rfea', period: { start: '2010-04', end: '2012-06' } },
];
