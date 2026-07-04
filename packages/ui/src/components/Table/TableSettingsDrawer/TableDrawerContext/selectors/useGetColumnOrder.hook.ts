import type { ColumnOrderState } from '@repo/ui/components/Table/Table.types';

import { useColumnsStore } from '../useColumnsStore.hook';

export const useGetColumnOrder = () =>
  useColumnsStore<ColumnOrderState>((state) => state.columnOrder);
