import { createContext } from 'react';

import type { ColumnDrawerContextValue } from './ColumnDrawerContext.types';

export const ColumnDrawerContext = createContext<
  ColumnDrawerContextValue | undefined
>(undefined);

ColumnDrawerContext.displayName = 'ColumnDrawerContext';
