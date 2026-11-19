import type { ArchitecturePattern, LeadershipItem } from '../types';

/**
 * iPad career data that is not text. Company records, periods, roles and descriptions are NOT
 * repeated here — they come from `shared/companies.ts` + `apple.companies` (single source of truth,
 * shared with the MacBook portfolio).
 */

/** Exactly the confirmed iOS technologies. */
export const iosTechnologies = [
  { id: 'swift', name: 'Swift', group: 'languages' },
  { id: 'objc', name: 'Objective-C', group: 'languages' },
  { id: 'uikit', name: 'UIKit', group: 'uiFrameworks' },
  { id: 'swiftui', name: 'SwiftUI', group: 'uiFrameworks' },
] as const;

/** Exactly the confirmed architectural patterns, in the owner's order. */
export const architecturePatterns: { id: ArchitecturePattern; name: string }[] = [
  { id: 'mvc', name: 'MVC' },
  { id: 'mvvm', name: 'MVVM' },
  { id: 'mvp', name: 'MVP' },
  { id: 'viper', name: 'VIPER' },
  { id: 'mv', name: 'MV' },
  { id: 'tca', name: 'TCA' },
];

/**
 * Leadership & mentoring responsibilities, each linked only to the companies whose approved
 * description documents it (no management roles implied):
 * - iOS technical reference, technical guidance, engineering decisions → Inditex description.
 * - Technical interviews → Banc Sabadell description.
 * - Mentoring new team members → Banc Sabadell and Banco Santander descriptions.
 */
export const leadershipContext: { id: LeadershipItem; companies: string[] }[] = [
  { id: 'techReference', companies: ['inditex'] },
  { id: 'interviews', companies: ['sabadell'] },
  { id: 'mentoring', companies: ['sabadell', 'santander'] },
  { id: 'guidance', companies: ['inditex'] },
  { id: 'decisions', companies: ['inditex'] },
];
