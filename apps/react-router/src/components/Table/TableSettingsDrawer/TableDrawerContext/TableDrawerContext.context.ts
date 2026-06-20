import { createContext } from 'react';

import type { TableDrawerContextValue } from './TableDrawerContext.types';

export const TableDrawerContext = createContext<
  undefined | TableDrawerContextValue
>(undefined);

TableDrawerContext.displayName = 'TableDrawerContext';
