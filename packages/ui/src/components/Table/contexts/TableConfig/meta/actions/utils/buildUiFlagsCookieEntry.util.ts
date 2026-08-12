import type { TableMetaState } from '#ui/components/Table/Table.types';

import { getPersistedUiState } from '#ui/components/Table/utils/getPersistedUiState.util';
import { getStorageKey } from '#ui/components/Table/utils/getStorageKey.util';
import {
  PERSISTENCE_VERSION,
  UI_FLAGS_COOKIE_KEY_SUFFIX,
} from '#ui/components/Table/utils/persistence.constants';
import { buildPersistCookieEntry } from '#ui/routing/actions/buildPersistCookieEntry.util';

type BuildUiFlagsCookieEntryArgs = {
  readonly currentState: Partial<TableMetaState> | undefined;
  readonly nextStatePatch: Partial<TableMetaState>;
};

/**
 * Build the cookie entry that persists the drawer UI flags (open / pinned /
 * selected tab / expanded filters). Merges the patch onto the current meta
 * state and serializes the **whole** `PersistedUiState`: the cookie is the only
 * channel the SSR loader can read, so anything left out would have to be applied
 * client-side after the drawer had already painted, shifting it at hydration.
 *
 * Returns `undefined` (a no-op) until the table has a persistence key. The
 * `uiFlags` cookie key is kept for backwards compatibility with cookies already
 * issued.
 */
export const buildUiFlagsCookieEntry = ({
  currentState,
  nextStatePatch,
}: BuildUiFlagsCookieEntryArgs) => {
  const nextState = {
    ...currentState,
    ...nextStatePatch,
  } as TableMetaState;
  const persistenceKey = nextState.persistenceKey ?? '';

  if (persistenceKey === '') {
    return;
  }

  const key = `${getStorageKey({ appId: nextState.appId, persistenceKey })}-${UI_FLAGS_COOKIE_KEY_SUFFIX}`;
  const value = JSON.stringify({
    value: getPersistedUiState(nextState),
    version: PERSISTENCE_VERSION,
  });

  return buildPersistCookieEntry({ key, value });
};
