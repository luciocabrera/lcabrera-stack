import { createContext } from 'react';

import type { TableConfigContextValue } from './TableConfigContext.types';

export const TableConfigContext = createContext<TableConfigContextValue | null>(
  null,
);

TableConfigContext.displayName = 'TableConfigContext';
