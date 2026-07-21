import type { ColumnOrderState } from '@lcabrera/ui/components/Table/Table.types';

import { useColumnsStore } from '../useColumnsStore.hook';

export const useGetColumnOrder = <TData = Record<string, unknown>>() =>
  useColumnsStore<ColumnOrderState<TData>>(
    (state) => state.columnOrder as ColumnOrderState<TData>,
  );
