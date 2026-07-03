import type { TableMetaState } from '../Table.types';

import { getPersistedUiState } from './getPersistedUiState.util';
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
  const persistenceKey = nextState.persistenceKey ?? '';

  if (persistenceKey === '') {
    return;
  }

  writePersistedUiStateToSessionStorage({
    persistenceKey,
    uiState: getPersistedUiState(nextState),
  });
};
