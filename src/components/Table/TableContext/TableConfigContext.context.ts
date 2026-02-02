import { createContext } from 'react';

import type { TableConfigContextValue } from './TableConfigContext.types';

import { getInitialColumnsState, getInitialMetaState } from './utils';

export const TableConfigContext = createContext<TableConfigContextValue>({
  columnsStore: getInitialColumnsState<unknown>({}),
  metaStore: getInitialMetaState({}),
} as unknown as TableConfigContextValue);

TableConfigContext.displayName = 'TableConfigContext';
