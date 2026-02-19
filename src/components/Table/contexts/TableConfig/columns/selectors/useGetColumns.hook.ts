import type { TableColumn } from '@/components/Table/Table.types';

import { useColumnsStore } from '../useColumnsStore.hook';

export const useGetColumns = <TData>() =>
  useColumnsStore<TableColumn<TData>[]>((state) => state.columns);
