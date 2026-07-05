import type { TableMetaState } from '../Table.types';

import { getPersistedUiState } from './getPersistedUiState.util';
import { writePersistedUiFlagsToCookie } from './writePersistedUiFlagsToCookie.util';
import { writePersistedUiStateToSessionStorage } from './writePersistedUiStateToSessionStorage.util';

type PersistTableMetaUiStateArgs = {
  readonly currentState: TableMetaState | undefined;
  readonly nextStatePatch: Partial<TableMetaState>;
};

export const persistTableMetaUiState = ({
  currentState,
  nextStatePatch,
}: PersistTableMetaUiStateArgs): void => {
  const nextState = {
    ...currentState,
    ...nextStatePatch,
  } as TableMetaState;
  const appId = nextState.appId;
  const persistenceKey = nextState.persistenceKey ?? '';

  if (persistenceKey === '') {
    return;
  }

  writePersistedUiStateToSessionStorage({
    appId,
    persistenceKey,
    uiState: getPersistedUiState(nextState),
  });

  // Mirror the open/pinned flags to a cookie so the loader can SSR-seed the
  // drawer state and avoid a hydration layout shift on the next document load.
  writePersistedUiFlagsToCookie({
    appId,
    persistenceKey,
    uiFlags: {
      isColumnSettingsOpen: nextState.isColumnSettingsOpen,
      isColumnSettingsPinned: nextState.isColumnSettingsPinned,
      isTableSettingsOpen: nextState.isTableSettingsOpen,
      isTableSettingsPinned: nextState.isTableSettingsPinned,
    },
  });
};
