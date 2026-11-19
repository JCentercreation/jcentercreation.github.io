import { useEffect } from 'react';
import { content } from '@/content';
import { useExperience } from './store';

/** Localized content for the current locale. Components never import a locale directly. */
export function useContent() {
  const locale = useExperience((s) => s.locale);
  return content[locale];
}

/** Keeps <html lang> and the document title in sync with the selected locale. */
export function useDocumentLocale() {
  const locale = useExperience((s) => s.locale);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = content[locale].ui.siteTitle;
  }, [locale]);
}
