import { readFromCookie } from '#ui/utils/storage';

import { getStorageKey } from './getStorageKey.util';
import { parseVersionedPayload } from './parseVersionedPayload.util';
import { UI_FLAGS_COOKIE_KEY_SUFFIX } from './persistence.constants';
import { toPersistedUiState } from './toPersistedUiState.util';

type ReadPersistedUiFlagsFromCookieArgs = {
  readonly appId?: string;
  readonly cookieString?: string;
  readonly persistenceKey: string;
};

export const readPersistedUiFlagsFromCookie = ({
  appId,
  cookieString,
  persistenceKey,
}: ReadPersistedUiFlagsFromCookieArgs) => {
  const key = `${getStorageKey({ appId, persistenceKey })}-${UI_FLAGS_COOKIE_KEY_SUFFIX}`;
  const rawValue = readFromCookie({ cookieString, key });

  if (!rawValue) return {};

  return toPersistedUiState(parseVersionedPayload({ rawValue }));
};
