import { createContext } from 'react';

import type { TableFocusContextValue } from './TableFocusContext.types';

export const TableFocusContext = createContext<
  TableFocusContextValue | undefined
>(undefined);

TableFocusContext.displayName = 'TableFocusContext';
