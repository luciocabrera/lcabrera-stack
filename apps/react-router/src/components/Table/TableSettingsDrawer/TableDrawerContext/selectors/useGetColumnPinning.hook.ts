import type { ColumnPinningState } from '@/components/Table/Table.types';

import { useColumnsStore } from '../useColumnsStore.hook.ts';

export const useGetColumnPinning = <TData = Record<string, unknown>>() =>
  useColumnsStore<ColumnPinningState<TData>>(
    (state) => state.columnPinning as ColumnPinningState<TData>,
  );
