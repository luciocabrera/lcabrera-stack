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
  const {
    columnsStore: tableColumnsStore,
    groupingStore: tableGroupingStore,
    metaStore,
  } = useTableConfigContextValue();

  const tableColumnsState = tableColumnsStore.get();
  const {
    columnFilters,
    columnOrder,
    columnPinning,
    columnSizing,
    columnVisibility,
    sorting,
  } = tableColumnsState;
  const { aggregates, keys, mode, periods, shares } = tableGroupingStore.get();

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
  const groupingStore = useStore<TableGroupingState>({
    aggregates,
    keys,
    mode,
    periods,
    shares,
  });
  // Seeded from the applied placement, defaulting the way every other reader of
  // it does — absent is `last`, the order the rows on screen are already in.
  const totalsPlacementStore = useStore<TableDrawerTotalsPlacementState>({
    totalsPlacement: metaStore.get()?.totalsPlacement ?? 'last',
  });

  return (
    <TableDrawerContext
      value={{ columnsStore, groupingStore, totalsPlacementStore }}
    >
      {children}
    </TableDrawerContext>
  );
};
