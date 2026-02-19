import { createContext } from 'react';

import { getInitialColumnsState, getInitialMetaState } from './utils';
import type { TableConfigContextValue } from './TableConfigContext.types';

export const TableConfigContext = createContext<TableConfigContextValue>({
  columnsStore: getInitialColumnsState({}),
  metaStore: getInitialMetaState({}),
} as unknown as TableConfigContextValue);

TableConfigContext.displayName = 'TableConfigContext';
