type GetAppScopedCookieKeyArgs = {
  /**
   * When provided, the key is prefixed so that apps sharing the same host (cookies are NOT
   * scoped by port) do not read or write each other's app-level cookies (theme, global
   * settings).
   */
  readonly appId?: string;
  readonly key: string;
};

export const getAppScopedCookieKey = ({
  appId,
  key,
}: GetAppScopedCookieKeyArgs) => (appId ? `${appId}-${key}` : key);
