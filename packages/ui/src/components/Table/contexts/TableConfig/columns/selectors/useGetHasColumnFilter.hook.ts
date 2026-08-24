import { useColumnsStore } from '../useColumnsStore.hook';

export const useGetHasColumnFilter = (columnKey: string) =>
  useColumnsStore((state) => Object.hasOwn(state.columnFilters, columnKey));
