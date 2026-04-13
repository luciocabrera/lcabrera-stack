import type { ColumnOrderState } from '@/components/Table/Table.types';

import { useColumnsStore } from '../useColumnsStore.hook.ts';

export const useGetColumnOrder = <TData = Record<string, unknown>>() =>
  useColumnsStore<ColumnOrderState<TData>>(
    (state) => state.columnOrder as ColumnOrderState<TData>,
  );
