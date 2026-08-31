import type {
  DataKey,
  TableColumnsState,
} from '#ui/components/Table/Table.types';
import type { TStore } from '#ui/hooks/useStore.hook';

import { resolveColumnSizingUpdate } from './resolveColumnSizingUpdate.util';

type WriteColumnSizingArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly columnsStore: TStore<TableColumnsState<TData>>;
  readonly width: number | undefined;
};

export const writeColumnSizing = <TData>({
  columnKey,
  columnsStore,
  width,
}: WriteColumnSizingArgs<TData>) => {
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
