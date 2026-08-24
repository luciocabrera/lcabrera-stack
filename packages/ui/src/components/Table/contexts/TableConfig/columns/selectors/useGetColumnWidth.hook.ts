import type { DataKey } from '#ui/components/Table/Table.types';

import { useColumnsStore } from '../useColumnsStore.hook';

export const useGetColumnWidth = <TData>(columnKey: DataKey<TData>) =>
  useColumnsStore<number | undefined, TData>(
    (state) => state.columnSizing[columnKey],
  );
