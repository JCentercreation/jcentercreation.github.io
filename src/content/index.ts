import type { LocaleContent, Locale } from './types';
import en from './en';
import es from './es';

export * from './types';
export { appleCompanies, automotiveCompanies, automotivePositions } from './shared/companies';
export { books } from './shared/books';
export { projects } from './shared/projects';
export { owner } from './shared/owner';

export const content: Record<Locale, LocaleContent> = { en, es };
