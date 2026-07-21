import type { ThemeMode } from '@repo/ui/types/theme.types';

import { getAppScopedCookieKey } from '@repo/ui/utils/storage';
import { readFromCookie } from '@repo/ui/utils/storage/readFromCookie.util';

import { THEME_COOKIE_NAME } from './theme.constants';

type GetThemeFromCookieArgs = {
  /** Optional per-app id used to scope the cookie key. */
  readonly appId?: string;
  /** Raw `Cookie` header string (SSR) or undefined (client). */
  readonly cookieHeader?: string;
};

/**
 * Get theme from cookie (SSR and browser-safe).
 */
export const getThemeFromCookie = ({
  appId,
  cookieHeader,
}: GetThemeFromCookieArgs): ThemeMode | undefined => {
  const theme = readFromCookie({
    cookieString: cookieHeader,
    key: getAppScopedCookieKey({ appId, key: THEME_COOKIE_NAME }),
  });

  if (theme === 'dark' || theme === 'light') {
    return theme;
  }

  return undefined;
};
