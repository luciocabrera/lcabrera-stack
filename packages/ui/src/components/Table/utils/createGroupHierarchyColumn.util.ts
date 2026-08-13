import type { DataKey, TableColumn } from '../Table.types';

import {
  TABLE_GROUP_HIERARCHY_COLUMN_KEY,
  TABLE_GROUP_HIERARCHY_MIN_WIDTH,
} from '../Table.constants';

type CreateGroupHierarchyColumnArgs<TData> = {
  readonly columns: readonly TableColumn<TData>[];
  /** The applied group keys, in nesting order. */
  readonly groupingKeys: readonly string[];
};

/** Reads as nesting rather than as a list — `Status › Country`. */
const HIERARCHY_LABEL_SEPARATOR = ' › ';

/**
 * The grid-owned column a grouped table renders its hierarchy in.
 *
 * Its **label names the group keys in nesting order** — `Status › Country` —
 * which carries two things the banner it replaces stated inline (ADR-065's
 * amendment): what the rows below are grouped by, and, by naming them, which
 * data columns blank on their detail rows. Without it the grid would spend a
 * column saying nothing and blank others without saying why.
 *
 * A key naming no declared column falls back to the key itself — the honest
 * answer for a URL naming a column this route does not render, and the same
 * fallback a group summary's own labels take.
 *
 * Every capability is off. It is not the consumer's column, so there is nothing
 * about it a user's layout state should be able to say: `isStatic` withholds
 * dragging, pinning, hiding and resizing through `resolveColumnCapabilities`,
 * and `isGroupable: false` keeps it out of the group-by affordance exactly as
 * `createActionsColumn` does. Its header stays visible — the label is the point.
 */
export const createGroupHierarchyColumn = <TData>({
  columns,
  groupingKeys,
}: CreateGroupHierarchyColumnArgs<TData>): TableColumn<TData> => {
  const labelByKey = new Map(
    columns.map((column) => [String(column.key), column.label]),
  );

  return {
    isFilterable: false,
    isGroupable: false,
    isResizable: false,
    isSortable: false,
    isStatic: true,
    key: TABLE_GROUP_HIERARCHY_COLUMN_KEY as DataKey<TData>,
    label: groupingKeys
      .map((groupKey) => labelByKey.get(groupKey) ?? groupKey)
      .join(HIERARCHY_LABEL_SEPARATOR),
    minWidth: TABLE_GROUP_HIERARCHY_MIN_WIDTH,
  };
};
