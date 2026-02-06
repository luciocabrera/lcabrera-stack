import {
  useGetColumnFilters,
  useGetColumnOrder,
  useGetColumnSizing,
  useGetColumnVisibility,
} from '@/components/Table/TableContext/hooks/store/columns/selectors';
import { useGetColumnsSorting } from '@/components/Table/TableContext/hooks/store/columns/selectors/useGetColumnsSorting.hook';
import { useStore } from '@/hooks';

import type {
  TableDrawerColumnsState,
  TableDrawerProviderProps,
} from './TableDrawerContext.types';

import { TableDrawerContext } from './TableDrawerContext.context';

export const TableDrawerProvider = ({ children }: TableDrawerProviderProps) => {
  const columnSizing = useGetColumnSizing();
  const columnsOrder = useGetColumnOrder();
  const columnVisibility = useGetColumnVisibility();
  const columnFilters = useGetColumnFilters();
  const columnsSorting = useGetColumnsSorting();

  const columnsStore = useStore<TableDrawerColumnsState<unknown>>({
    columnFilters,
    columnOrder: columnsOrder,
    columnSizing,
    columnVisibility,
    sorting: columnsSorting,
  });

  return (
    <TableDrawerContext value={{ columnsStore }}>{children}</TableDrawerContext>
  );
};
