import { createContext } from 'react';

import { getInitialColumnsState } from '@/components/Table/contexts/TableConfig/utils';

import type { TableDrawerContextValue } from './TableDrawerContext.types';

export const TableDrawerContext = createContext<TableDrawerContextValue>({
  columnsStore: getInitialColumnsState<Record<string, unknown>>({}),
} as unknown as TableDrawerContextValue);

TableDrawerContext.displayName = 'TableDrawerContext';
