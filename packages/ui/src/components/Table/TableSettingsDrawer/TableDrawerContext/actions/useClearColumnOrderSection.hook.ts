import { useTableConfigContextValue } from '@lcabrera/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { useTableDrawerContextValue } from '../useTableDrawerContextValue.hook';
import { getDefaultColumnPinning } from './getDefaultColumnPinning.util';

export const useClearColumnOrderSection = () => {
  const { columnsStore: tableColumnsStore } = useTableConfigContextValue();
  const { columnsStore } = useTableDrawerContextValue();

  return () => {
    const defaultPinning = getDefaultColumnPinning(
      tableColumnsStore.get()?.columnPinning,
    );

    columnsStore.set({
      columnPinning: defaultPinning,
      columnVisibility: new Set(),
    });
  };
};
