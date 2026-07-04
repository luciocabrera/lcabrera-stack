import type { ThemeMode } from '@repo/ui/types/theme.types';

import { readFromCookie } from '@repo/ui/utils/storage/readFromCookie.util';
import { THEME_COOKIE_NAME } from './themeCookie.constants';

/**
 * Get theme from cookie (SSR and browser-safe).
 */
export const getThemeFromCookie = (
  cookieHeader: null | string | undefined,
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
