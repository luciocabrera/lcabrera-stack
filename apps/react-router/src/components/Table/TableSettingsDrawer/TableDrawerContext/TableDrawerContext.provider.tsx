import type { TableColumnsState } from '@/components/Table/Table.types';

import { useTableConfigContextValue } from '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useStore } from '@/hooks';

import type {
  TableDrawerColumnsState,
  TableDrawerProviderProps,
} from './TableDrawerContext.types';

import { TableDrawerContext } from './TableDrawerContext.context';

export const TableDrawerProvider = ({ children }: TableDrawerProviderProps) => {
  const { columnsStore: tableColumnsStore } = useTableConfigContextValue();

  const tableColumnsState =
    tableColumnsStore.get() ?? ({} as TableColumnsState);
  const {
    columnFilters,
    columnOrder,
    columnPinning,
    columnSizing,
    columnVisibility,
    sorting,
  } = tableColumnsState;

  const columnsStore = useStore<
    TableDrawerColumnsState<Record<string, unknown>>
  >({
    columnFilters,
    columnOrder,
    columnPinning,
    columnSizing,
    columnVisibility,
    sorting,
  });

  return (
    <TableDrawerContext value={{ columnsStore }}>{children}</TableDrawerContext>
  );
};
