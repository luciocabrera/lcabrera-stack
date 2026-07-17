import { readFromCookie } from '@repo/ui/utils/storage';

import type { PersistedUiState } from './persistence.types';

import { getStorageKey } from './getStorageKey.util';
import { parseVersionedPayload } from './parseVersionedPayload.util';
import { UI_FLAGS_COOKIE_KEY_SUFFIX } from './persistence.constants';

type ReadPersistedUiFlagsFromCookieArgs = {
  readonly appId?: string;
  readonly cookieString?: string;
  readonly persistenceKey: string;
};

/**
 * Read the persisted drawer UI state from cookies synchronously (SSR-safe).
 * Returns an empty object when nothing is stored or the payload is invalid.
 * Used by the route loader to seed the initial meta state so the drawer renders
 * in its persisted state on the first paint — this is the authoritative source,
 * nothing client-side may override it.
 */
export const readPersistedUiFlagsFromCookie = ({
  appId,
  cookieString,
  persistenceKey,
}: ReadPersistedUiFlagsFromCookieArgs) => {
  const key = `${getStorageKey({ appId, persistenceKey })}-${UI_FLAGS_COOKIE_KEY_SUFFIX}`;
  const rawValue = readFromCookie({ cookieString, key });

  if (!rawValue) return {};

  return parseVersionedPayload<PersistedUiState>({ rawValue }) ?? {};
};
