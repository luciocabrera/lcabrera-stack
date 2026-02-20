import { useCallback } from 'react';
import { useFetcher } from 'react-router';

const PERSIST_COOKIE_ACTION = '/_action/persist-cookie';

type PersistCookieArgs = {
  key: string;
  value: string;
};

/**
 * Hook that persists cookies via a server action (Set-Cookie header).
 *
 * Uses useFetcher to POST to the /api/persist-cookie resource route,
 * which sets the cookie server-side via Set-Cookie response header.
 *
 * @example
 * const persistCookie = usePersistCookieAction();
 * persistCookie({ key: 'table-state-orders-columnFilters', value: '{"status":"active"}' });
 */
export const usePersistCookieAction = () => {
  const fetcher = useFetcher();

  return useCallback(
    ({ key, value }: PersistCookieArgs) => {
      void fetcher.submit(
        { key, value },
        { action: PERSIST_COOKIE_ACTION, method: 'POST' },
      );
    },
    [fetcher],
  );
};
