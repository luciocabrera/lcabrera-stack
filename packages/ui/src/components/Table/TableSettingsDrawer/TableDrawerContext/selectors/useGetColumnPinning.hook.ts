import type { ColumnPinningState } from '#ui/components/Table/Table.types';

import { useColumnsStore } from '../useColumnsStore.hook';

export const useGetColumnPinning = <TData = Record<string, unknown>>() =>
  useColumnsStore<ColumnPinningState<TData>>(
    (state) => state.columnPinning as ColumnPinningState<TData>,
  );
