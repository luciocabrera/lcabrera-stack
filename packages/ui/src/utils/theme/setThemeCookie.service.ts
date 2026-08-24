import type { ThemeMode } from '#ui/types/theme.types';

import { PERSIST_COOKIE_ACTION } from '#ui/constants/globalSettings.constants';
import { buildPersistCookieEntry } from '#ui/routing/actions/buildPersistCookieEntry.util';
import { getAppScopedCookieKey } from '#ui/utils/storage';

import { THEME_COOKIE_NAME } from './theme.constants';

type SetThemeCookieArgs = {
  readonly appId?: string;
  readonly theme: ThemeMode;
};

/**
 * Persist the theme through the same `/_action/persist-cookie` action every other cookie
 * write uses, so the `Set-Cookie` comes from the server.
 */
const persistThemeCookieServerSide = ({ appId, theme }: SetThemeCookieArgs) => {
  if (
    globalThis.fetch === undefined ||
    globalThis.FormData === undefined ||
    globalThis.location === undefined
  ) {
    return;
  }

  const currentUrl = `${globalThis.location.pathname}${globalThis.location.search}`;
  const entries = [
    buildPersistCookieEntry({
      key: getAppScopedCookieKey({ appId, key: THEME_COOKIE_NAME }),
      value: theme,
    }),
  ];

  const formData = new FormData();
  formData.set('currentUrl', currentUrl);
  formData.set('entries', JSON.stringify(entries));

  void globalThis.fetch(PERSIST_COOKIE_ACTION, {
    body: formData,
    method: 'POST',
  });
};

export const setThemeCookie = ({ appId, theme }: SetThemeCookieArgs) => {
  // Persist through the React Router action so Set-Cookie comes from the server.
  persistThemeCookieServerSide({ appId, theme });
};
