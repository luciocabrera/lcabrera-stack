import { createContext } from 'react';

import type { TableDrawerContextValue } from './TableDrawerContext.types';

export const TableDrawerContext = createContext<
  TableDrawerContextValue | undefined
>(undefined);

TableDrawerContext.displayName = 'TableDrawerContext';
