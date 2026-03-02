import type {
  ColumnSizingState,
  DataKey,
} from '@/components/Table/Table.types';

import { useColumnsStore } from '../useColumnsStore.hook';

export const useGetNormalizedColumnSize = <TData>(columnKey: DataKey<TData>) =>
  useColumnsStore<ColumnSizingState<TData>[DataKey<TData>], TData>(
    (state) => state.columnSizing[columnKey],
  );
