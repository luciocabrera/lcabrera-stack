import { buildCookieString } from './buildCookieString.util';

type WriteToCookieArgs = {
  /**
   * Optional response headers for SSR context.
   * When provided, appends a Set-Cookie header instead of using document.cookie.
   */
  headers?: Headers;
  key: string;
  value: string;
};

/**
 * Write to cookie (expires in 1 year, SSR-safe)
 *
 * @param key - The cookie key to write
 * @param value - The cookie value to write
 * @param headers - Optional response Headers for SSR context. If provided, appends a Set-Cookie header.
 *
 * @example
 * // Client-side (browser)
 * writeToCookie({ key: 'theme', value: 'dark' });
 *
 * @example
 * // Server-side (React Router loader/action)
 * export const action = ({ request }: ActionFunctionArgs) => {
 *   const headers = new Headers();
 *   writeToCookie({ headers, key: 'theme', value: 'dark' });
 *   return json({ ok: true }, { headers });
 * };
 */
export const writeToCookie = ({
  headers,
  key,
  value,
}: WriteToCookieArgs): void => {
  const cookieValue = buildCookieString({ key, value });

  // SSR: append Set-Cookie header
  if (headers) {
    headers.append('Set-Cookie', cookieValue);
    return;
  }

  // Client: use document.cookie
  if (typeof document === 'undefined') return;

  // eslint-disable-next-line unicorn/no-document-cookie -- Assignment is the only way to set cookies
  document.cookie = cookieValue;
};
