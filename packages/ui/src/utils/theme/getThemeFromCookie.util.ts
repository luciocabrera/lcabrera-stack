import type { ThemeMode } from '@repo/ui/types/theme.types';

import { getAppScopedCookieKey } from '@repo/ui/utils/storage';
import { readFromCookie } from '@repo/ui/utils/storage/readFromCookie.util';
import { THEME_COOKIE_NAME } from './themeCookie.constants';

/**
 * Get theme from cookie (SSR and browser-safe).
 *
 * @param cookieHeader - Raw `Cookie` header string (SSR) or undefined (client).
 * @param appId - Optional per-app id used to scope the cookie key.
 */
export const getThemeFromCookie = (
  cookieHeader: null | string | undefined,
  appId?: string,
): ThemeMode | undefined => {
  const theme = readFromCookie({
    cookieString: cookieHeader ?? undefined,
    key: getAppScopedCookieKey({ appId, key: THEME_COOKIE_NAME }),
  });

  if (theme === 'dark' || theme === 'light') {
    return theme;
  }

  return undefined;
};
