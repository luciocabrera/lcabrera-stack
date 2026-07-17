import { writeToCookie } from '@repo/ui/utils/storage';

import type { PersistedUiState } from './persistence.types';

import { getStorageKey } from './getStorageKey.util';
import {
  PERSISTENCE_VERSION,
  UI_FLAGS_COOKIE_KEY_SUFFIX,
} from './persistence.constants';

type WritePersistedUiFlagsToCookieArgs = {
  readonly appId?: string;
  /** Optional response headers for SSR Set-Cookie writes. */
  readonly headers?: Headers;
  readonly persistenceKey: string;
  readonly uiFlags: PersistedUiState;
};

/**
 * Persist the drawer UI state to a cookie so it is sent with the next document
 * request and can be read in the SSR loader. This lets the table render the
 * drawer in its persisted state on the first paint, avoiding the hydration
 * layout shift.
 *
 * The cookie carries the **whole** `PersistedUiState`, not just open/pinned:
 * it is the only channel SSR can read, so anything left out would have to be
 * applied client-side after the drawer had already painted. The `uiFlags`
 * cookie key is kept for backwards compatibility with cookies already issued.
 *
 * Client-side this writes `document.cookie` directly (no server round-trip);
 * pass `headers` to emit a `Set-Cookie` header from an SSR loader/action.
 *
 * Hands `writeToCookie` the raw JSON: it URI-encodes the value itself (via
 * `buildCookieString`), and encoding here too would store a double-encoded
 * payload that `parseVersionedPayload` cannot parse — silently emptying the
 * flags the loader reads, so the drawer would SSR closed and pop open at
 * hydration.
 */
export const writePersistedUiFlagsToCookie = ({
  appId,
  headers,
  persistenceKey,
  uiFlags,
}: WritePersistedUiFlagsToCookieArgs) => {
  const key = `${getStorageKey({ appId, persistenceKey })}-${UI_FLAGS_COOKIE_KEY_SUFFIX}`;
  const serialized = JSON.stringify({
    value: uiFlags,
    version: PERSISTENCE_VERSION,
  });

  writeToCookie({ headers, key, value: serialized });
};
