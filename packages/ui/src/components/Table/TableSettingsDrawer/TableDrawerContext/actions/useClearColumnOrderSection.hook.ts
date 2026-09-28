import type { ColumnOrderState } from '#ui/components/Table/Table.types';

import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';
import { getClearedColumnPinning } from './getClearedColumnPinning.util';

export const useClearColumnOrderSection = () => {
  const { columnsStore: tableColumnsStore } = useTableConfigContextValue();
  const { columnsStore } = useTableDrawerContextValue();

  return () => {
    columnsStore.set({
      columnOrder: [] as ColumnOrderState,
      columnPinning: getClearedColumnPinning(tableColumnsStore.get()),
      columnVisibility: new Set(),
    });
  };
};
