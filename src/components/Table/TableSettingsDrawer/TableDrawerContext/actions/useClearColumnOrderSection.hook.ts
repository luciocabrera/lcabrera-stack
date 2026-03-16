import type { ColumnPinningState } from '@/components/Table/Table.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';

export const useClearColumnOrderSection = () => {
  const { columnsStore: tableColumnsStore } = useTableConfigContextValue();
  const { columnsStore } = useTableDrawerContextValue();

  return () => {
    const defaultPinning =
      tableColumnsStore.get()?.columnPinning ??
      ({ left: [], right: [] } as ColumnPinningState);

    columnsStore.set({
      columnPinning: defaultPinning,
      columnVisibility: new Set(),
    });
  };
};
