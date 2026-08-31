import type { ThemeMode } from '#ui/types/theme.types';

import { getAppScopedCookieKey } from '#ui/utils/storage';
import { readFromCookie } from '#ui/utils/storage/readFromCookie.util';

import { THEME_COOKIE_NAME } from './theme.constants';

type GetThemeFromCookieArgs = {
  readonly appId?: string;
  readonly cookieHeader?: string;
};

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
