import type { OwnerLinkId } from '../types';

/**
 * Owner identity — the single place to change the displayed name and public links.
 * "Javier Carrillo" is the owner-approved provisional professional name.
 */
export const owner = {
  name: 'Javier Carrillo',
  shortName: 'Javi',
  /**
   * Owner-approved public links (recovered from the previous site, /legacy/). Every component reads
   * them from here. No e-mail address is published on this site (owner decision).
   */
  links: {
    linkedin: 'https://www.linkedin.com/in/javiercarrillogallego',
    github: 'https://github.com/JCentercreation',
    misfitsStudio: 'https://jcentercreation.github.io/misfitsStudio/',
  } satisfies Record<OwnerLinkId, string>,
};

/** The profiles listed under "Contact", in order. */
export const contactLinks: readonly Extract<OwnerLinkId, 'linkedin' | 'github'>[] = ['linkedin', 'github'];
