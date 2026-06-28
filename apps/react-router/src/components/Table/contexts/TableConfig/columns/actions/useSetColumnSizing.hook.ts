import type { DataKey } from '@/components/Table/Table.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

import { resolveColumnSizingUpdate } from './utils';

type SetColumnSizingArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly width: number | undefined;
};

/**
 * Hook to update column sizing (resize)
 */
export const useSetColumnSizing = <TData>() => {
  const { columnsStore } = useTableConfigContextValue<TData>();

  return ({ columnKey, width }: SetColumnSizingArgs<TData>) => {
    const columnsState = columnsStore.get();
    const { columnSizing, pinnedColumnOffsets } =
      resolveColumnSizingUpdate<TData>({
        columnKey,
        columnPinning: columnsState?.columnPinning,
        columnSizingState: columnsState?.columnSizing,
        effectiveColumns: columnsState?.effectiveColumns ?? [],
        width,
      });

    columnsStore.set({ columnSizing, pinnedColumnOffsets });
  };
};
