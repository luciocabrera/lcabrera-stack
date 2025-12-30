import { DEFAULT_LOCALE } from './formatters.constants';

/**
 * Get the default locale from the browser or fall back to DEFAULT_LOCALE
 */
export const getDefaultLocale = (): string =>
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  globalThis.navigator?.language ?? DEFAULT_LOCALE;
