import type { ColumnPinningState } from '@/components/Table/Table.types';

import { useColumnsStore } from '../useColumnsStore.hook';

export const useGetColumnPinning = <TData>() =>
  useColumnsStore<ColumnPinningState<TData>>((state) => state.columnPinning);
