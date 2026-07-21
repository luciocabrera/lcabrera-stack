import type { TableColumn } from '@lcabrera/ui/components/Table/Table.types';

import { useColumnsStore } from '../useColumnsStore.hook';

export const useGetColumns = <TData = Record<string, unknown>>() =>
  useColumnsStore<TableColumn<TData>[]>(
    (state) => state.columns as TableColumn<TData>[],
  );
