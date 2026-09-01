import { readFromCookie } from '#ui/utils/storage';

import { collectPersistedStateSlices } from './collectPersistedStateSlices.util';

type ReadPersistedStateFromCookieArgs = {
  readonly appId?: string;
  readonly cookieString?: string;
  readonly persistenceKey: string;
};

export const readPersistedStateFromCookie = ({
  appId,
  cookieString,
  persistenceKey,
}: ReadPersistedStateFromCookieArgs) =>
  collectPersistedStateSlices({
    appId,
    persistenceKey,
    readRawSlice: (sliceKey) => readFromCookie({ cookieString, key: sliceKey }),
  });
