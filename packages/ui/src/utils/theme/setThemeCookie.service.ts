import type { ThemeMode } from '@repo/ui/types/theme.types';

import { PERSIST_COOKIE_ACTION } from '@repo/ui/constants/globalSettings.constants';
import { getAppScopedCookieKey } from '@repo/ui/utils/storage';

import { THEME_COOKIE_NAME } from './themeCookie.constants';

type PersistThemeCookieEntry = {
  readonly key: string;
  readonly searchParamKey: string;
  readonly searchParamValue: string;
  readonly value: ThemeMode;
};

type SetThemeCookieArgs = {
  /**
   * Optional per-app id used to scope the cookie key so apps sharing a host
   * (cookies ignore port) do not overwrite each other.
   */
  readonly appId?: string;
  /** The theme mode to persist. */
  readonly theme: ThemeMode;
};

const persistThemeCookieServerSide = ({ appId, theme }: SetThemeCookieArgs) => {
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
      key: getAppScopedCookieKey({ appId, key: THEME_COOKIE_NAME }),
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
export const setThemeCookie = ({ appId, theme }: SetThemeCookieArgs) => {
  // Persist through the React Router action so Set-Cookie comes from the server.
  persistThemeCookieServerSide({ appId, theme });
};
