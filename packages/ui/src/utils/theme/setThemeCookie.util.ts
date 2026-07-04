import type { ThemeMode } from '@repo/ui/types/theme.types';

import { PERSIST_COOKIE_ACTION } from '@repo/ui/constants/globalSettings.constants';

import { THEME_COOKIE_NAME } from './themeCookie.constants';

type PersistThemeCookieEntry = {
  readonly key: string;
  readonly searchParamKey: string;
  readonly searchParamValue: string;
  readonly value: ThemeMode;
};

const persistThemeCookieServerSide = (theme: ThemeMode): void => {
  if (
    globalThis.fetch === undefined ||
    globalThis.FormData === undefined ||
    globalThis.location === undefined
  ) {
    return;
  }

  const currentUrl = `${globalThis.location.pathname}${globalThis.location.search}`;
  const entries: readonly PersistThemeCookieEntry[] = [
    {
      key: THEME_COOKIE_NAME,
      searchParamKey: '',
      searchParamValue: '',
      value: theme,
    },
  ];

  const formData = new FormData();
  formData.set('currentUrl', currentUrl);
  formData.set('entries', JSON.stringify(entries));

  void globalThis.fetch(PERSIST_COOKIE_ACTION, {
    body: formData,
    method: 'POST',
  });
};

/**
 * Set theme cookie (for client-side use).
 */
export const setThemeCookie = (theme: ThemeMode): void => {
  // Persist through the React Router action so Set-Cookie comes from the server.
  persistThemeCookieServerSide(theme);
};
