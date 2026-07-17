import type { TableMetaState } from '../Table.types';

import { getPersistedUiState } from './getPersistedUiState.util';
import { writePersistedUiFlagsToCookie } from './writePersistedUiFlagsToCookie.service';

type PersistTableMetaUiStateArgs = {
  readonly currentState: TableMetaState | undefined;
  readonly nextStatePatch: Partial<TableMetaState>;
};

export const persistTableMetaUiState = ({
  currentState,
  nextStatePatch,
}: PersistTableMetaUiStateArgs) => {
  const nextState = {
    ...currentState,
    ...nextStatePatch,
  } as TableMetaState;
  const appId = nextState.appId;
  const persistenceKey = nextState.persistenceKey ?? '';

  if (persistenceKey === '') {
    return;
  }

  // The cookie is the single channel: the loader reads it to SSR-seed the
  // drawer, so a second client-only copy could only disagree with the markup
  // already painted and shift it at hydration.
  writePersistedUiFlagsToCookie({
    appId,
    persistenceKey,
    uiFlags: getPersistedUiState(nextState),
  });
};
