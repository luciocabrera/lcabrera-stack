/**
 * Cookies are not scoped by port, so apps sharing a host would otherwise read
 * and write each other's app-level cookies (theme, global settings). The app
 * prefix is what keeps them apart.
 */

type GetAppScopedCookieKeyArgs = {
  readonly appId?: string;
  readonly key: string;
};

export const getAppScopedCookieKey = ({
  appId,
  key,
}: GetAppScopedCookieKeyArgs) => (appId ? `${appId}-${key}` : key);
