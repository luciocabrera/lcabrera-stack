import { useCallback } from 'react';

import type { ColumnSizingState } from '@/components/Table/Table.types';

import { useTableConfigContextValue } from '@/components/Table/TableContext/hooks/useTableConfigContextValue.hook';

type SetColumnSizingArgs = {
  columnKey: string;
  width: number | undefined;
};

/**
 * Hook to update column sizing (resize)
 */
export const useSetColumnSizing = () => {
  const { columnsStore } = useTableConfigContextValue();

  return useCallback(
    ({ columnKey, width }: SetColumnSizingArgs) => {
      const current = columnsStore.get()?.columnSizing ?? {};

      let columnSizing: ColumnSizingState;
      if (width === undefined) {
        // Remove the key by creating new object without it
        const { [columnKey]: unusedColumn, ...rest } = current;
        void unusedColumn; // Explicitly mark as intentionally unused
        columnSizing = rest;
      } else {
        columnSizing = { ...current, [columnKey]: width };
      }

      columnsStore.set({ columnSizing });
    },
    [columnsStore],
  );
};
