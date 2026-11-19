import type { ProjectRecord } from '../types';

/**
 * Personal projects shown in the MacBook "Projects" note.
 * Names and links come from the owner's previous site (/legacy/).
 */
export const projects: ProjectRecord[] = [
  { id: 'writingfree', name: 'writingfree', url: 'https://apps.apple.com/app/writingfree/id6751441278' },
  { id: 'necktimer', name: 'necktimer', url: 'https://www.necktimer.com/' },
  {
    id: 'proof',
    name: 'PROOF – Image Verification',
    url: 'https://jcentercreation.github.io/PROOF-Image_Verification/',
  },
  {
    id: 'swift-courses',
    name: 'Swift courses',
    // PROVISIONAL course titles (owner decision: keep them, internal flag only — never shown to visitors).
    // Inferred from the URLs; the previous site linked both only as "this". Exact names still unverified.
    provisionalNames: true,
    url: 'https://www.swiftconcurrencyexplained.com',
    links: [
      { name: 'Swift Concurrency Explained', url: 'https://www.swiftconcurrencyexplained.com' },
      {
        name: 'Swift Security Course',
        url: 'https://jcentercreation.github.io/SwiftSecurityCourse/documentation/swiftsecuritycourse/',
      },
    ],
  },
];
