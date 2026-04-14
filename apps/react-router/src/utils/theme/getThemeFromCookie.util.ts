import type { ThemeMode } from '@/types/theme.types';

import { parseCookies } from '../storage/parseCookies.util';
import { THEME_COOKIE_NAME } from './themeCookie.constants';

/**
 * Get theme from cookie header (for server-side use).
 */
export const getThemeFromCookie = (
  cookieHeader: null | string,
): ThemeMode | undefined => {
  if (!cookieHeader) {
    return undefined;
  }

  const cookies = parseCookies(cookieHeader);
  const theme = cookies[THEME_COOKIE_NAME];

  if (theme === 'dark' || theme === 'light') {
    return theme;
  }

  return undefined;
};
