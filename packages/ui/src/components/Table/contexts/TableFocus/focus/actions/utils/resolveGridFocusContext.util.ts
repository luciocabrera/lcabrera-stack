import type {
  TableColumnsState,
  TableDataState,
  TableFocusState,
  TableGroupExpansionState,
  TableGroupingState,
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
  readonly groupingState: TableGroupingState;
  readonly metaState: TableMetaState;
};

/**
 * Collapsing changes the index space the grid navigates, which is exactly why focus is
 * keyed by row identity and re-resolved here on every move (ADR-062, ADR-067).
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
