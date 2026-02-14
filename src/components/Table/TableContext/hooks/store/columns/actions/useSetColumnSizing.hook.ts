import { useCallback } from 'react';

import type {
  ColumnSizingState,
  DataKey,
} from '@/components/Table/Table.types';

import { useTableConfigContextValue } from '@/components/Table/TableContext/hooks/useTableConfigContextValue.hook';

type SetColumnSizingArgs<TData> = {
  columnKey: DataKey<TData>;
  width: number | undefined;
};

/**
 * Hook to update column sizing (resize)
 */
export const useSetColumnSizing = <TData>() => {
  const { columnsStore } = useTableConfigContextValue<TData>();

  return useCallback(
    ({ columnKey, width }: SetColumnSizingArgs<TData>) => {
      const current = (columnsStore.get()?.columnSizing ??
        {}) as ColumnSizingState<TData>;

      let columnSizing = {} as ColumnSizingState<TData>;
      if (width === undefined) {
        // Remove the key by creating new object without it
        const { [columnKey]: unusedColumn, ...rest } = current;
        void unusedColumn; // Explicitly mark as intentionally unused
        columnSizing = rest as ColumnSizingState<TData>;
      } else {
        columnSizing = { ...current, [columnKey]: width };
      }

      columnsStore.set({ columnSizing });
    },
    [columnsStore],
  );
};
