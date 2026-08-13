import type {
  ColumnOrderState,
  ColumnPinningState,
  DataKey,
  TableColumn,
} from '../Table.types';

import { TABLE_GROUP_HIERARCHY_COLUMN_KEY } from '../Table.constants';
import { createGroupHierarchyColumn } from './createGroupHierarchyColumn.util';

type WithGroupHierarchyColumnArgs<TData> = {
  readonly columnOrder: ColumnOrderState<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly columns: readonly TableColumn<TData>[];
  readonly groupingKeys: readonly string[];
};

/**
 * The three column inputs the view state is derived from, with the hierarchy
 * column put at the head of each while grouping is applied — and returned
 * unchanged while it is not.
 *
 * It is prepended to **all three**, and each one is load-bearing:
 *
 * - `columns`, so the column exists at all: `getEffectiveColumns` derives the
 *   painted list from it and `getNormalizedColumns` the map the header cell
 *   reads its label out of.
 * - `columnPinning.left`, so it is left-pinned. Sticky offsets are a running
 *   sum over the left-pinned columns, so a hierarchy column outside that list
 *   leaves every consumer-pinned left column's offset short by its width and
 *   the sticky columns overlap (ADR-065).
 * - `columnOrder`, so it is left-pinned **first**. `orderColumnsByKeys` appends
 *   a column the order does not mention, which would otherwise put the grid's
 *   own column last among the user's pinned ones.
 *
 * **This is a derivation, never state.** The store keeps the consumer's
 * `columns`, `columnOrder` and `columnPinning` exactly as they arrived, so the
 * synthetic key never reaches the cookie the layout persists through and never
 * reaches the settings drawer, which reads the store's own `columns`. That is
 * the difference from the actions column, which is a real member of `columns`
 * and has to be filtered back out of persisted pinning at every seam.
 */
export const withGroupHierarchyColumn = <TData>({
  columnOrder,
  columnPinning,
  columns,
  groupingKeys,
}: WithGroupHierarchyColumnArgs<TData>) => {
  if (groupingKeys.length === 0) {
    return { columnOrder, columnPinning, columns };
  }

  const hierarchyKey = TABLE_GROUP_HIERARCHY_COLUMN_KEY as DataKey<TData>;

  return {
    columnOrder: [hierarchyKey, ...columnOrder],
    columnPinning: {
      left: [hierarchyKey, ...columnPinning.left],
      right: columnPinning.right,
    },
    columns: [
      createGroupHierarchyColumn<TData>({ columns, groupingKeys }),
      ...columns,
    ],
  };
};
