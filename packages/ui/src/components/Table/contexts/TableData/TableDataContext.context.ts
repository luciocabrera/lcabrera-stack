import { createContext } from 'react';

import type { TableDataContextValue } from './TableDataContext.types';

export const TableDataContext = createContext<
  TableDataContextValue | undefined
>(undefined);

TableDataContext.displayName = 'TableDataContext';
