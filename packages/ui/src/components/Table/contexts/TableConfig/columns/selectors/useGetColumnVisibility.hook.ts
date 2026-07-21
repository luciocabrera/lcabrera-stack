import type { ColumnVisibilityState } from '@lcabrera/ui/components/Table/Table.types';

import { useColumnsStore } from '../useColumnsStore.hook';

export const useGetColumnVisibility = <TData = Record<string, unknown>>() =>
  useColumnsStore<ColumnVisibilityState<TData>>(
    (state) => state.columnVisibility as ColumnVisibilityState<TData>,
  );
