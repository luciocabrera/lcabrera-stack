import type {
  ColumnGroupingCapability,
  GroupCardinalityEstimate,
  GroupingMode,
} from './group-query-builder.types.ts';

import { expandGroupingSets } from './expand-grouping-sets.util.ts';

type EstimateGroupCardinalityArgs = {
  readonly capabilities: Readonly<Record<string, ColumnGroupingCapability>>;
  readonly grouping: GroupingMode;
  readonly keys: readonly string[];
};

/**
 * An upper bound on the rows a grouped read will return, from the catalogue's
 * per-column distinct estimates.
 *
 * It sums the product over **the grouping sets the query will actually emit**,
 * taken from the same `expandGroupingSets` the SQL is built from, rather than
 * from a per-mode formula. That is the load-bearing part: a mode whose sets are
 * not prefixes — cube, next — gets a correct bound the day its expansion lands,
 * with nothing here to update. The empty set contributes the grand total's 1.
 *
 * A bound, not a prediction. `∏dₖ` assumes every key combination occurs, and
 * real data is sparser than that, so this over-estimates — safe for a ceiling,
 * and the reason a *warning* threshold sits below the refusal one (ADR-066).
 *
 * One key with no estimate makes the whole answer `unknown`: a product with an
 * unknown factor is unknown, and quietly treating the missing factor as 1 would
 * turn the widest column in the request into the one that hides the cost.
 */
export const estimateGroupCardinality = ({
  capabilities,
  grouping,
  keys,
}: EstimateGroupCardinalityArgs): GroupCardinalityEstimate => {
  const unknownColumns = keys.filter(
    (key) => capabilities[key]?.distinctEstimate === undefined,
  );

  if (unknownColumns.length > 0) {
    return { columns: unknownColumns, kind: 'unknown' };
  }

  const sets = expandGroupingSets({ grouping, keys });
  const rows = sets.reduce(
    (total, set) =>
      total +
      set.reduce(
        (product, key) => product * (capabilities[key]?.distinctEstimate ?? 1),
        1,
      ),
    0,
  );

  return { kind: 'known', rows };
};
