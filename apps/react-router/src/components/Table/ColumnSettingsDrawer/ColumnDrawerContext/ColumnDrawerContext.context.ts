import { createContext } from 'react';

import type { ColumnDrawerContextValue } from './ColumnDrawerContext.types';

import { getInitialColumnsState } from './utils';

export const ColumnDrawerContext = createContext<ColumnDrawerContextValue>({
  columnStore: getInitialColumnsState<Record<string, unknown>>({}),
} as unknown as ColumnDrawerContextValue);

ColumnDrawerContext.displayName = 'ColumnDrawerContext';
