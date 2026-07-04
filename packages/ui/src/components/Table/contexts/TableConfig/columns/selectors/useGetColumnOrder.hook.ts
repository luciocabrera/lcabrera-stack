import type { ColumnOrderState } from '@repo/ui/components/Table/Table.types';

import { useColumnsStore } from '../useColumnsStore.hook';

export const useGetColumnOrder = <TData = Record<string, unknown>>() =>
  useColumnsStore<ColumnOrderState<TData>>(
    (state) => state.columnOrder as ColumnOrderState<TData>,
  );
