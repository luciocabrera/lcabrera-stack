import type {
  NormalizedColumnsState,
  TableGroupRowSummary,
} from '#ui/components/Table/Table.types';

import { TABLE_AGGREGATE_LABELS } from '#ui/components/Table/Table.constants';

type ToGroupHeaderSegmentsArgs = {
  readonly normalizedColumns: NormalizedColumnsState<Record<string, unknown>>;
  readonly summary: TableGroupRowSummary;
};

/**
 * The text a group header row shows, as an ordered list of segments: one per
 * group key from outermost to innermost, then one per selected aggregate.
 *
 * A list rather than a joined string, because the row renders each segment in
 * its own element — the key values ellipsize independently and the aggregates
 * are styled apart from them.
 *
 * The human label comes from the columns store rather than the row, because a
 * group summary carries column *keys*: a label is a property of the table's
 * configuration, not of the data. A key the table has no column for falls back
 * to the key itself, which is the honest answer for a URL naming a column this
 * route does not render.
 */
export const toGroupHeaderSegments = ({
  normalizedColumns,
  summary,
}: ToGroupHeaderSegmentsArgs) => {
  const labelOf = (columnKey: string) =>
    normalizedColumns[columnKey]?.label ?? columnKey;

  return [
    ...summary.path.map(({ columnKey, label }) => ({
      key: `key:${columnKey}`,
      text: `${labelOf(columnKey)}: ${label}`,
    })),
    ...summary.aggregates.map(({ columnKey, fn, label }) => ({
      key: `agg:${fn}:${columnKey}`,
      text: `${TABLE_AGGREGATE_LABELS[fn]} of ${labelOf(columnKey)}: ${label}`,
    })),
  ];
};
