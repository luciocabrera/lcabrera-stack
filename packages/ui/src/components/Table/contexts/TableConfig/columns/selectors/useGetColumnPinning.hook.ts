import type { ColumnPinningState } from '@repo/ui/components/Table/Table.types';

import { useColumnsStore } from '../useColumnsStore.hook';

export const useGetColumnPinning = <TData>() =>
  useColumnsStore<ColumnPinningState<TData>, TData>(
    (state) => state.columnPinning,
  );
