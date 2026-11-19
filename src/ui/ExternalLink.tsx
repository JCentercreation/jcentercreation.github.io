import type { CSSProperties, ReactNode } from 'react';
import { owner, type CompanyRecord, type LocaleContent, type OwnerLinkId } from '@/content';

/**
 * A link to another site: opens in a new tab with safe attributes. The arrow is decorative; screen
 * readers hear the link text followed by "(opens in a new tab)".
 */
export function ExternalLink({ href, newTab, children, className, style }: { href: string; newTab: string; children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} style={style}>
      {children}
      <span aria-hidden="true"> ↗</span>
      <span className="visually-hidden"> ({newTab})</span>
    </a>
  );
}

/** URL of one of the owner's approved links (single source: shared/owner.ts). */
export const ownerLink = (id: OwnerLinkId) => owner.links[id];

/** "Misfits Studio website" / "Sitio web de Misfits Studio". */
export const websiteText = (c: LocaleContent, company: CompanyRecord) => c.contact.websiteOf.replace('{name}', company.name);
