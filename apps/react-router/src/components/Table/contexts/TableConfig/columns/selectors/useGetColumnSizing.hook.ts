import type { ColumnSizingState } from '@/components/Table/Table.types';

import { useColumnsStore } from '../useColumnsStore.hook.ts';

export const useGetColumnSizing = <TData = Record<string, unknown>>() =>
  useColumnsStore<ColumnSizingState<TData>>(
    (state) => state.columnSizing as ColumnSizingState<TData>,
  );
