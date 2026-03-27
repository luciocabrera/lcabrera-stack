/**
 * Parse cookies from a cookie header string
 *
 * @example
 * ```ts
 * parseCookies('theme=dark; lang=en') // { theme: 'dark', lang: 'en' }
 * parseCookies('data=foo=bar')        // { data: 'foo=bar' }
 * ```
 */
export const parseCookies = (cookieHeader: string): Record<string, string> => {
  const cookies: Record<string, string> = {};

  for (const cookie of cookieHeader.split(";")) {
    const [name, ...valueParts] = cookie.trim().split("=");
    if (name) {
      cookies[name] = valueParts.join("=");
    }
  }

  return cookies;
};
