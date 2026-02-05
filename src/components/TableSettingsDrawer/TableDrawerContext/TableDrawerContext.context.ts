import { createContext } from 'react';

import { getInitialColumnsState } from '@/components/Table/TableContext/utils';

import type { TableDrawerContextValue } from './TableDrawerContext.types';

export const TableDrawerContext = createContext<TableDrawerContextValue>({
  columnsStore: getInitialColumnsState<unknown>({}),
} as unknown as TableDrawerContextValue);

TableDrawerContext.displayName = 'TableDrawerContext';  