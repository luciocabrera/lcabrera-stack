import { createContext } from 'react';

import type { ColumnDrawerContextValue } from './ColumnDrawerContext.types';

export const ColumnDrawerContext =
  createContext<ColumnDrawerContextValue | null>(null);

ColumnDrawerContext.displayName = 'ColumnDrawerContext';
