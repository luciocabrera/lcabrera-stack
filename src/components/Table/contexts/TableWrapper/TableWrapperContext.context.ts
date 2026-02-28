import { createContext } from 'react';

import type { TableWrapperContextValue } from './TableWrapperContext.types';

export const TableWrapperContext = createContext<
  TableWrapperContextValue | undefined
>(undefined);

TableWrapperContext.displayName = 'TableWrapperContext';
