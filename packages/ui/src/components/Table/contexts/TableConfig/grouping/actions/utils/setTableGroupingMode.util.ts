import type {
  TableGroupingMode,
  TableGroupingState,
} from '#ui/components/Table/Table.types';

type SetTableGroupingModeArgs = {
  readonly grouping: TableGroupingState;
  readonly mode: TableGroupingMode;
};

/**
 * Sets which grouping sets the read emits, leaving the keys and aggregates
 * exactly as they are.
 *
 * The mode is orthogonal to both by construction: `rollup` adds the prefixes of
 * the key list to the sets already emitted, so switching it changes how many
 * rows come back and never what any of them is grouped by. That is why it is a
 * field beside `keys` rather than a shape the key list encodes.
 *
 * It is settable with no key applied, and harmless there — `serializeGroupingToURL`
 * drops the whole configuration when the key list is empty, so a mode nobody can
 * see never reaches the URL.
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
