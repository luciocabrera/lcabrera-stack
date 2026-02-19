import type { ColumnSizingState } from '@/components/Table/Table.types';

import { useColumnsStore } from '../useColumnsStore.hook';

export const useGetColumnSizing = <TData>() =>
  useColumnsStore<ColumnSizingState<TData>>((state) => state.columnSizing);
