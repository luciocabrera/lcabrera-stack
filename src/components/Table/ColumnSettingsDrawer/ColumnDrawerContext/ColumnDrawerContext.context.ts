import { createContext } from 'react';

import { getInitialColumnsState } from '@/components/Table/contexts/TableConfig/utils';

import type { ColumnDrawerContextValue } from './ColumnDrawerContext.types';

export const ColumnDrawerContext = createContext<ColumnDrawerContextValue>({
  columnStore: getInitialColumnsState<unknown>({}),
} as unknown as ColumnDrawerContextValue);

ColumnDrawerContext.displayName = 'ColumnDrawerContext';
