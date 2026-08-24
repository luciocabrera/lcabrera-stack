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
