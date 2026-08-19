import type {
  TableColumnsState,
  TableGroupExpansionState,
  TableGroupingState,
  TableMetaState,
} from '#ui/components/Table/Table.types';

import { useStore } from '#ui/hooks';

import type {
  TableConfigContextValue,
  TableConfigProviderProps,
} from './TableConfigContext.types';

import { TableConfigContext } from './TableConfigContext.context';
import {
  getInitialColumnsState,
  getInitialExpansionState,
  getInitialGroupingState,
  getInitialMetaState,
} from './utils';

export const TableConfigProvider = <TData extends Record<string, unknown>>({
  children,
  columnsState,
  metaState,
  onDrillGroup,
}: TableConfigProviderProps<TData>) => {
  // All three stores seed purely from the loader's URL- and cookie-derived
  // state, so the client renders exactly what the server did — see
  // getInitialColumnsState.
  const normalizedMetaState = getInitialMetaState({ ...metaState });
  const normalizedGroupingState = getInitialGroupingState({
    groupingAggregates: metaState?.groupingAggregates,
    groupingKeys: metaState?.groupingKeys,
    groupingMode: metaState?.groupingMode,
    groupingPeriods: metaState?.groupingPeriods,
  });
  // Seeded from the grouping state rather than from the raw meta, so the
  // hierarchy column appears under exactly the key list the grouping store
  // accepted — an illegal one is refused there, and a column injected for a
  // grouping that was refused would be a column labelling nothing.
  const normalizedColumnsState = getInitialColumnsState<TData>({
    ...columnsState,
    crud: metaState?.crud,
    groupingKeys: normalizedGroupingState.keys,
  });

  const columnsStore = useStore<TableColumnsState<TData>>(
    normalizedColumnsState,
  );
  const metaStore = useStore<TableMetaState>(normalizedMetaState);
  const groupingStore = useStore<TableGroupingState>(normalizedGroupingState);
  // Expansion seeds from nothing — it is client state and does not travel in
  // the URL (ADR-061), so there is no loader half of it to normalize.
  const expansionStore = useStore<TableGroupExpansionState>(
    getInitialExpansionState(),
  );

  const value: TableConfigContextValue<TData> = {
    columnsStore,
    expansionStore,
    groupingStore,
    metaStore,
    onDrillGroup,
  };

  // The context is declared non-generic; useTableConfigContextValue<TData>()
  // restores the generic on read. Erase the type parameter only here.
  return (
    <TableConfigContext value={value as TableConfigContextValue}>
      {children}
    </TableConfigContext>
  );
};
