import { useCallback } from 'react';

import type { ColumnSizingState } from '../Table.types';

import { writeStateSlice } from '../utils';

type UseTablePersistenceArgs = {
  getState: () => {
    columnSizing: ColumnSizingState;
  };
  /** Required key for storage */
  persistenceKey: string;
};

export const useTablePersistence = ({
  getState,
  persistenceKey,
}: UseTablePersistenceArgs) => {
  // Persist specific slice
  const persistSlice = useCallback(() => {
    const currentState = getState();

    const value = currentState.columnSizing;
    writeStateSlice({
      persistenceKey,
      slice: 'columnSizing',
      storageType: 'cookie',
      value,
    });
  }, [getState, persistenceKey]);

  return {
    persistSlice,
  };
};
