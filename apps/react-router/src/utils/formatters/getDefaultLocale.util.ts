import { DEFAULT_LOCALE } from './formatters.constants';

/**
 * Get the default locale for formatting.
 *
 * Uses DEFAULT_LOCALE to ensure SSR hydration consistency.
 * The server doesn't have access to navigator.language, so using
 * the browser's locale would cause hydration mismatches.
 *
 * If you need locale-specific formatting, pass the locale explicitly
 * from a context or prop that's synchronized between server and client.
 */
export const getDefaultLocale = (): string => DEFAULT_LOCALE;
