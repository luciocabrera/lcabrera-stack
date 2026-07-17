import type { PersistCookieEntry } from '@repo/ui/routing/persistCookie.types';

import { PERSIST_COOKIE_ACTION } from '@repo/ui/constants/globalSettings.constants';
import { useFetcher, useLocation } from 'react-router';

type UsePersistCookieActionArgs = {
  /**
   * Stable `useFetcher` key scoping this concern's submissions. A stable key
   * makes a newer submit supersede an in-flight one, giving last-write-wins for
   * rapid repeats (e.g. toggling a drawer twice) — the ordering guarantee the
   * old synchronous `document.cookie` write had for free.
   */
  readonly fetcherKey: string;
};

/**
 * The single client-side cookie-write primitive. Submits entries to the
 * `/_action/persist-cookie` server action so the `Set-Cookie` header comes from
 * the server — the only channel the SSR loader can read back to seed first
 * paint. Theme, global settings, table state, column sizing and drawer UI flags
 * all persist through it.
 *
 * Cookie-only entries (empty `searchParam*`) make the action respond `204`,
 * which {@link shouldRevalidatePersistCookieAction} skips — no loader refetch.
 *
 * @param fetcherKey - stable key isolating this concern's fetcher (see the arg
 *   doc for why the key must be stable).
 */
export const usePersistCookieAction = ({
  fetcherKey,
}: UsePersistCookieActionArgs) => {
  const fetcher = useFetcher({ key: fetcherKey });
  const location = useLocation();

  return (entries: readonly PersistCookieEntry[]) => {
    const currentUrl = `${location.pathname}${location.search}`;

    void fetcher.submit(
      { currentUrl, entries: JSON.stringify(entries) },
      { action: PERSIST_COOKIE_ACTION, method: 'POST' },
    );
  };
};
