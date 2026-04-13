import type { TableColumn } from '@/components/Table/Table.types';

import { useColumnsStore } from '../useColumnsStore.hook.ts';

export const useGetColumns = <TData = Record<string, unknown>>() =>
  useColumnsStore<TableColumn<TData>[]>(
    (state) => state.columns as TableColumn<TData>[],
  );
