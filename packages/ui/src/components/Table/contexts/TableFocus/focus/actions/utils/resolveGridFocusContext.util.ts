import type {
  TableColumnsState,
  TableDataState,
  TableFocusState,
  TableMetaState,
} from '#ui/components/Table/Table.types';

import { getGridColumnKeys } from './getGridColumnKeys.util';
import { resolveFocusedRowIndex } from './resolveFocusedRowIndex.util';

type ResolveGridFocusContextArgs<TData extends Record<string, unknown>> = {
  readonly columnsState: TableColumnsState<TData>;
  readonly dataState: TableDataState<TData>;
  readonly focusState: TableFocusState;
  readonly metaState: TableMetaState;
};

/**
 * Everything a focus move needs to know about the grid right now, derived once
 * from the four store snapshots its callers have already taken.
 *
 * Entering the grid and navigating within it ask the same three questions —
 * which columns can be focused, where the remembered row is in the rows loaded
 * now, and how tall a row is — so the derivation lives here rather than being
 * written twice and drifting apart. Snapshots come in as arguments, so this
 * stays pure and the store reads stay in the action hooks where the
 * one-snapshot-per-store rule can be seen.
 */
export const resolveGridFocusContext = <TData extends Record<string, unknown>>({
  columnsState,
  dataState,
  focusState,
  metaState,
}: ResolveGridFocusContextArgs<TData>) => {
  const { columns, pinnedColumnPartition } = columnsState;
  const { data } = dataState;

  return {
    columnKeys: getGridColumnKeys(pinnedColumnPartition),
    columns,
    data,
    focusedRowIndex: resolveFocusedRowIndex({
      columns,
      data,
      rowIndex: focusState.rowIndex,
      rowKey: focusState.rowKey,
    }),
    rowHeight: metaState.rowHeight,
  };
};
