import type { PersistCookieEntry } from './routing.types';

type BuildPersistCookieEntryArgs = {
  readonly key: string;
  readonly value: string;
};

/**
 * Build a cookie-only `/_action/persist-cookie` entry: a `key`/`value` write
 * with empty search-param fields, so the server sets the cookie without
 * touching the URL (a `204`, no revalidation).
 *
 * The shared builder for every client that persists a single value to a cookie
 * — theme, column sizing, drawer UI flags — so the empty-search-param shape is
 * expressed once rather than re-literal'd at each call site.
 */
export const buildPersistCookieEntry = ({
  key,
  value,
}: BuildPersistCookieEntryArgs) =>
  ({
    key,
    searchParamKey: '',
    searchParamValue: '',
    value,
  }) satisfies PersistCookieEntry;
