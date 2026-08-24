import { useFetcher, useLocation } from 'react-router';

import type { PersistCookieEntry } from '#ui/routing/actions/routing.types';

import { PERSIST_COOKIE_ACTION } from '#ui/constants/globalSettings.constants';

type UsePersistCookieActionArgs = {
  /**
   * A stable key makes a newer submit supersede an in-flight one, giving last-write-wins for
   * rapid repeats (e.g.
   * toggling a drawer twice) — the ordering guarantee the old synchronous `document.cookie`
   * write had for free.
   */
  readonly fetcherKey: string;
};

/**
 * Submits entries to the `/_action/persist-cookie` server action so the `Set-Cookie`
 * header comes from the server — the only channel the SSR loader can read back to seed
 * first paint.
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
