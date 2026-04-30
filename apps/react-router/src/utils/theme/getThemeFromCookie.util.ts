import type { ThemeMode } from '@/types/theme.types';

import { readFromCookie } from '../storage/readFromCookie.util';
import { THEME_COOKIE_NAME } from './themeCookie.constants';

/**
 * Get theme from cookie (SSR and browser-safe).
 */
export const getThemeFromCookie = (
  cookieHeader: null | string,
): ThemeMode | undefined => {
  const theme = readFromCookie({
    cookieString: cookieHeader ?? undefined,
    key: THEME_COOKIE_NAME,
  });

  if (theme === 'dark' || theme === 'light') {
    return theme;
  }

  return undefined;
};
