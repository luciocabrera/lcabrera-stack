import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useStore } from '#ui/hooks';

import type {
  TableDrawerColumnsState,
  TableDrawerProviderProps,
  TableDrawerTotalsPlacementState,
} from './TableDrawerContext.types';

import { TableDrawerContext } from './TableDrawerContext.context';

export const TableDrawerProvider = ({ children }: TableDrawerProviderProps) => {
  const { columnsStore: tableColumnsStore, groupingStore: tableGroupingStore } =
    useTableConfigContextValue();

  const tableColumnsState = tableColumnsStore.get();
  const grouping = tableGroupingStore.get();
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
  const groupingStore = useStore<TableGroupingState>(grouping);
  const totalsPlacementStore = useStore<TableDrawerTotalsPlacementState>({
    totalsPlacement: grouping.totalsPlacement,
  });

  return (
    <TableDrawerContext
      value={{ columnsStore, groupingStore, totalsPlacementStore }}
    >
      {children}
    </TableDrawerContext>
  );
};
