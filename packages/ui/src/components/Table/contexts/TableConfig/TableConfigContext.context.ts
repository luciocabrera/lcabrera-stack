import { createContext } from 'react';

import type { TableConfigContextValue } from './TableConfigContext.types';

export const TableConfigContext = createContext<
  TableConfigContextValue | undefined
>(undefined);

TableConfigContext.displayName = 'TableConfigContext';
