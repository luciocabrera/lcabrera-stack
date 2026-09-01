import { useFetcher, useLocation } from 'react-router';

import type { PersistCookieEntry } from '#ui/routing/actions/routing.types';

import { PERSIST_COOKIE_ACTION } from '#ui/constants/globalSettings.constants';

type UsePersistCookieActionArgs = {
  readonly fetcherKey: string;
};

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
