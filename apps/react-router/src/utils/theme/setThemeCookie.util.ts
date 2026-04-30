import type { ThemeMode } from '@/types/theme.types';

import {
  THEME_COOKIE_MAX_AGE_DAYS,
  THEME_COOKIE_NAME,
} from './themeCookie.constants';

type PersistThemeCookieEntry = {
  readonly key: string;
  readonly searchParamKey: string;
  readonly searchParamValue: string;
  readonly value: ThemeMode;
};

const PERSIST_COOKIE_ACTION = '/_action/persist-cookie';

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
  // SSR guard - document may not exist on server
  /* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */
  if (globalThis.document === undefined) {
    return;
  }

  const maxAge = THEME_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  /* eslint-disable-next-line unicorn/no-document-cookie */
  globalThis.document.cookie = `${THEME_COOKIE_NAME}=${theme}; path=/; max-age=${maxAge}; SameSite=Lax`;
  persistThemeCookieServerSide(theme);
};
