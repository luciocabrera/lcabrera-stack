import { createContext } from 'react';

import type { TablePersistence } from './TableConfigContext.types';

export const TablePersistenceContext = createContext<
  TablePersistence | undefined
>(undefined);

TablePersistenceContext.displayName = 'TablePersistenceContext';
