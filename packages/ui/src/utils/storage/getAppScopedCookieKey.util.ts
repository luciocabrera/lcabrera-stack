type GetAppScopedCookieKeyArgs = {
  /**
   * Per-application identifier. When provided, the key is prefixed so that
   * apps sharing the same host (cookies are NOT scoped by port) do not read or
   * write each other's app-level cookies (theme, global settings). Omit for
   * app-agnostic (legacy) keys.
   */
  readonly appId?: string;
  readonly key: string;
};

/**
 * Build an optionally app-scoped cookie key: `{appId}-{key}` when `appId` is
 * provided, otherwise the bare `key`.
 *
 * Cookies are shared across ports on the same host, so two apps running on
 * `localhost:5173` and `localhost:5174` see the same cookie jar. Scoping the
 * key by `appId` keeps each app's persisted preferences isolated.
 */
export const getAppScopedCookieKey = ({
  appId,
  key,
}: GetAppScopedCookieKeyArgs): string => (appId ? `${appId}-${key}` : key);
