import { createContext } from 'react';

import type { TableDrawerContextValue } from './TableDrawerContext.types';

export const TableDrawerContext = createContext<null | TableDrawerContextValue>(
  null,
);

TableDrawerContext.displayName = 'TableDrawerContext';
