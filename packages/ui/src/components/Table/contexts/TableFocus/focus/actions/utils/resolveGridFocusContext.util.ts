import type {
  TableColumnsState,
  TableDataState,
  TableFocusState,
  TableGroupExpansionState,
  TableMetaState,
} from '#ui/components/Table/Table.types';

import { resolveTableGroupTree } from '#ui/components/Table/contexts/TableConfig/expansion/utils';

import { getGridColumnKeys } from './getGridColumnKeys.util';
import { resolveFocusedRowIndex } from './resolveFocusedRowIndex.util';

type ResolveGridFocusContextArgs<TData extends Record<string, unknown>> = {
  readonly columnsState: TableColumnsState<TData>;
  readonly dataState: TableDataState<TData>;
  readonly expansionState: TableGroupExpansionState;
  readonly focusState: TableFocusState;
  readonly metaState: TableMetaState;
};

/**
 * Everything a focus move needs to know about the grid right now, derived once
 * from the store snapshots its callers have already taken.
 *
 * Entering the grid and navigating within it ask the same questions — which
 * columns can be focused, which rows exist, where the remembered row is among
 * them, and how tall a row is — so the derivation lives here rather than being
 * written twice and drifting apart. Snapshots come in as arguments, so this
 * stays pure and the store reads stay in the action hooks where the
 * one-snapshot-per-store rule can be seen.
 *
 * `data` is the **visible** rows, not every loaded one. A row hidden under a
 * collapsed ancestor has no cell to receive focus, so a move that counted it
 * would consume a key press and land nowhere — the same failure the group row
 * itself has while it registers no cell (#651). Collapsing changes the index
 * space the grid navigates, which is exactly why focus is keyed by row identity
 * and re-resolved here on every move (ADR-062, ADR-067).
 */
export const resolveGridFocusContext = <TData extends Record<string, unknown>>({
  columnsState,
  dataState,
  expansionState,
  focusState,
  metaState,
}: ResolveGridFocusContextArgs<TData>) => {
  const { columns, pinnedColumnPartition } = columnsState;
  const { rowMeta, rows } = resolveTableGroupTree({
    collapsedGroupPaths: expansionState.collapsedGroupPaths,
    data: dataState.data,
  });

  return {
    columnKeys: getGridColumnKeys(pinnedColumnPartition),
    columns,
    data: rows,
    focusedRowIndex: resolveFocusedRowIndex({
      columns,
      data: rows,
      rowIndex: focusState.rowIndex,
      rowKey: focusState.rowKey,
    }),
    rowHeight: metaState.rowHeight,
    rowMeta,
  };
};
