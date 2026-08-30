import type { DataKey, TableColumn } from '#ui/components/Table/Table.types';

import { useColumnsStore } from '../useColumnsStore.hook';

export const useGetDeclaredColumn = <TData = Record<string, unknown>>(
  columnKey: DataKey<TData>,
) =>
  useColumnsStore<TableColumn<TData> | undefined, TData>((state) =>
    state.columns.find((declared) => declared.key === columnKey),
  );
