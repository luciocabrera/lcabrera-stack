/**
 * Resolve the locale used to format detail values.
 * Falls back to the browser locale when no explicit locale is provided.
 * @param locale - The optional explicit locale.
 * @returns The resolved locale, or undefined when none is available.
 */
export const resolveDetailsLocale = (locale: string | undefined) => {
  if (locale) {
    return locale;
  }

  if (typeof navigator === 'undefined') {
    return;
  }

  return navigator.language;
};
