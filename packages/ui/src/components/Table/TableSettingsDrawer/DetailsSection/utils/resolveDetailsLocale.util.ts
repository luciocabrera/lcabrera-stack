export const resolveDetailsLocale = (locale: string | undefined) => {
  if (locale) {
    return locale;
  }

  if (typeof navigator === 'undefined') {
    return;
  }

  return navigator.language;
};
