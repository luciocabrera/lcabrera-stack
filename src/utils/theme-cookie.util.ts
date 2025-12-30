import type { ThemeMode } from '@/types/theme.types';

const THEME_COOKIE_NAME = 'theme';
const COOKIE_MAX_AGE_DAYS = 365; // 1 year

/**
 * Parse cookies from a cookie header string
 */
export const parseCookies = (cookieHeader: string): Record<string, string> => {
  const cookies: Record<string, string> = {};

  for (const cookie of cookieHeader.split(';')) {
    const [name, ...valueParts] = cookie.trim().split('=');
    if (name) {
      // eslint-disable-next-line security/detect-object-injection
      cookies[name] = valueParts.join('=');
    }
  }

  return cookies;
};

/**
 * Get theme from cookie header (for server-side use)
 */
export const getThemeFromCookie = (cookieHeader: null | string): ThemeMode | undefined => {
  if (!cookieHeader) {
    return undefined;
  }

  const cookies = parseCookies(cookieHeader);
  // eslint-disable-next-line security/detect-object-injection
  const theme = cookies[THEME_COOKIE_NAME];

  if (theme === 'dark' || theme === 'light') {
    return theme;
  }

  return undefined;
};

/**
 * Set theme cookie (for client-side use)
 * Uses document.cookie API for cookie management
 */
export const setThemeCookie = (theme: ThemeMode): void => {
  // SSR guard - document may not exist on server
  /* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */
  if (globalThis.document === undefined) {
    return;
  }

  const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60; // Convert to seconds
  /* eslint-disable-next-line unicorn/no-document-cookie */
  globalThis.document.cookie = `${THEME_COOKIE_NAME}=${theme}; path=/; max-age=${maxAge}; SameSite=Lax`;
};

/**
 * Get theme from cookie on client side
 */
export const getClientThemeCookie = (): ThemeMode | undefined => {
  // SSR guard - document may not exist on server
  /* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */
  if (globalThis.document === undefined) {
    return undefined;
  }

   
  return getThemeFromCookie(globalThis.document.cookie);
};
