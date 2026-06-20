import { createContext } from 'react';

import type { TableConfigContextValue } from './TableConfigContext.types';

export const TableConfigContext = createContext<
  undefined | TableConfigContextValue
>(undefined);

TableConfigContext.displayName = 'TableConfigContext';
