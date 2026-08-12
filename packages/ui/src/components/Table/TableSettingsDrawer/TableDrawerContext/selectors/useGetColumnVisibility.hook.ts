import type { ColumnVisibilityState } from '#ui/components/Table/Table.types';

import { useColumnsStore } from '../useColumnsStore.hook';

export const useGetColumnVisibility = <TData = Record<string, unknown>>() =>
  useColumnsStore<ColumnVisibilityState<TData>>(
    (state) => state.columnVisibility as ColumnVisibilityState<TData>,
  );
