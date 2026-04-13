import { createContext } from 'react';

import type { ColumnDrawerContextValue } from './ColumnDrawerContext.types.ts';

import { getInitialColumnsState } from './utils/index.ts';

export const ColumnDrawerContext = createContext<ColumnDrawerContextValue>({
  columnStore: getInitialColumnsState<Record<string, unknown>>({}),
} as unknown as ColumnDrawerContextValue);

ColumnDrawerContext.displayName = 'ColumnDrawerContext';
