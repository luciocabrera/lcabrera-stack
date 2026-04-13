import { parseCookies } from './parseCookies.util.ts';

type ReadFromCookieArgs = {
  readonly cookieString?: string;
  readonly key: string;
};

/**
 * Read from cookie (SSR-safe)
 *
 * @param key - The cookie key to read
 * @param cookieString - Optional cookie string for SSR context. If not provided, uses document.cookie
 */
export const readFromCookie = ({
  cookieString,
  key,
}: ReadFromCookieArgs): string | undefined => {
  // In browser, use document.cookie
  if (typeof document !== 'undefined' && !cookieString) {
    const cookies = parseCookies(document.cookie);
    return cookies[key];
  }

  // In SSR or when cookie string is provided
  if (cookieString) {
    const cookies = parseCookies(cookieString);
    return cookies[key];
  }

  return undefined;
};
