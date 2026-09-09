import type {
  TableChromeState,
  TableTotalsPlacement,
} from '#ui/components/Table/Table.types';

import { getPersistedUiState } from '#ui/components/Table/utils/getPersistedUiState.util';
import { getStorageKey } from '#ui/components/Table/utils/getStorageKey.util';
import {
  PERSISTENCE_VERSION,
  UI_FLAGS_COOKIE_KEY_SUFFIX,
} from '#ui/components/Table/utils/persistence.constants';
import { buildPersistCookieEntry } from '#ui/routing/actions/buildPersistCookieEntry.util';

type BuildUiFlagsCookieEntryArgs = {
  readonly currentState: Partial<TableChromeState> | undefined;
  readonly nextStatePatch: Partial<TableChromeState>;
  readonly totalsPlacement?: TableTotalsPlacement;
};

export const buildUiFlagsCookieEntry = ({
  currentState,
  nextStatePatch,
  totalsPlacement,
}: BuildUiFlagsCookieEntryArgs) => {
  const nextState = {
    ...currentState,
    ...nextStatePatch,
  };
  const persistenceKey = nextState.persistenceKey ?? '';

  if (persistenceKey === '') {
    return;
  }

  const key = `${getStorageKey({ appId: nextState.appId, persistenceKey })}-${UI_FLAGS_COOKIE_KEY_SUFFIX}`;
  const value = JSON.stringify({
    value: getPersistedUiState({
      chrome: nextState,
      totalsPlacement,
    }),
    version: PERSISTENCE_VERSION,
  });

  return buildPersistCookieEntry({ key, value });
};
