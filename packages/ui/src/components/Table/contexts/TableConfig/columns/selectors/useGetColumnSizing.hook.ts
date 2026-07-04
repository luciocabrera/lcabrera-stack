import type { ColumnSizingState } from '@repo/ui/components/Table/Table.types';

import { useColumnsStore } from '../useColumnsStore.hook';

export const useGetColumnSizing = <TData = Record<string, unknown>>() =>
  useColumnsStore<ColumnSizingState<TData>>(
    (state) => state.columnSizing as ColumnSizingState<TData>,
  );
