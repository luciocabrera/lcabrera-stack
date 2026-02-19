import type { ColumnVisibilityState } from '@/components/Table/Table.types';

import { useColumnsStore } from '../useColumnsStore.hook';

export const useGetColumnVisibility = <TData>() =>
  useColumnsStore<ColumnVisibilityState<TData>>(
    (state) => state.columnVisibility,
  );
