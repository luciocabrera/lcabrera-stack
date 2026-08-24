import type {
  TableGroupingMode,
  TableGroupingState,
} from '#ui/components/Table/Table.types';

type SetTableGroupingModeArgs = {
  readonly grouping: TableGroupingState;
  readonly mode: TableGroupingMode;
};

/**
 * Sets which grouping sets the read emits, leaving the keys and aggregates exactly as they
 * are.
 * The mode is orthogonal to both by construction: `rollup` adds the prefixes of the key
 * list to the sets already emitted, so switching it changes how many rows come back and
 * never what any of them is grouped by.
 */
export const setTableGroupingMode = ({
  grouping,
  mode,
}: SetTableGroupingModeArgs): TableGroupingState => ({
  aggregates: grouping.aggregates,
  keys: grouping.keys,
  mode,
  periods: grouping.periods,
  shares: grouping.shares,
});
