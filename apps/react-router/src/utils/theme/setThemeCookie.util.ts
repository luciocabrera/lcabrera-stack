import type { ThemeMode } from '@/types/theme.types';

import {
  THEME_COOKIE_MAX_AGE_DAYS,
  THEME_COOKIE_NAME,
} from './themeCookie.constants';

/**
 * Set theme cookie (for client-side use).
 */
export const setThemeCookie = (theme: ThemeMode): void => {
  // SSR guard - document may not exist on server
  /* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */
  if (globalThis.document === undefined) {
    return;
  }

  const maxAge = THEME_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  /* eslint-disable-next-line unicorn/no-document-cookie */
  globalThis.document.cookie = `${THEME_COOKIE_NAME}=${theme}; path=/; max-age=${maxAge}; SameSite=Lax`;
};
