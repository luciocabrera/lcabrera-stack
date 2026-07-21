/**
 * One entry in a `/_action/persist-cookie` submission.
 *
 * `key`/`value` are the cookie to write (a cookie-only write supplies both);
 * `searchParamKey`/`searchParamValue` optionally update the URL in the same
 * round-trip. Empty search-param strings mean "no URL change", which makes the
 * action respond `204` and skip loader revalidation.
 *
 * This is the single client-submit shape shared by every caller of
 * {@link usePersistCookieAction} (theme, global settings, table state, column
 * sizing, drawer UI flags), so the payload is defined once. `key`/`value` are
 * optional because the table-state path can emit a URL-only entry.
 */
export type PersistCookieEntry = {
  readonly key?: string;
  readonly searchParamKey: string;
  readonly searchParamValue: string;
  readonly value?: string;
};
