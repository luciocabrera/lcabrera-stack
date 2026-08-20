import type {
  TableColumnAggregate,
  TableGroupingMode,
  TableGroupingState,
  TableGroupPeriod,
} from '#ui/components/Table/Table.types';

import {
  areGroupAggregatesLegal,
  areGroupKeysLegal,
  pruneGroupPeriods,
  pruneGroupShares,
} from '../grouping/utils';

type GetInitialGroupingStateArgs = {
  readonly groupingAggregates?: readonly TableColumnAggregate[];
  readonly groupingKeys?: readonly string[];
  readonly groupingMode?: TableGroupingMode;
  readonly groupingPeriods?: Readonly<Record<string, TableGroupPeriod>>;
  readonly groupingShares?: readonly TableColumnAggregate[];
};

const NO_GROUPING: TableGroupingState = {
  aggregates: [],
  keys: [],
  mode: 'flat',
  periods: {},
  shares: [],
};

/**
 * Builds the grouping store's initial state from the configuration the loader
 * applied.
 *
 * Both halves arrive on `metaState` rather than as their own loader field,
 * because the loader's returned shape is pinned to three keys and inferred
 * structurally — a fourth would change the loader data type of every table
 * route at once. Seeding from meta keeps the applied grouping travelling with
 * the rest of the loader's serializable state (ADR-009) at no cost to that
 * shape.
 *
 * **This is a write path, and it checks the same shape invariants the outer
 * boundaries do** — `areGroupKeysLegal` (within the depth cap, and no key
 * repeated) and `areGroupAggregatesLegal` (no `(columnKey, fn)` pair repeated).
 * A route built on `createTableRouteLoader` cannot reach it with an illegal
 * list, because `sanitizeGroupingByColumns` already refused — but
 * `@lcabrera/ui` is published, and a consumer writing their own loader is the
 * intended use rather than an edge case. Without these guards such a route seeds
 * a store the package then renders as grouped, and the query throws at
 * `assertGroupKeys` or at `assertGroupAliases`, which refuses two projections
 * deriving one alias: a 500 out of a state the package itself accepted.
 *
 * The **aggregate** guard is newer than the key one and exists because the shape
 * change removed an implicit check: while `aggregates` was a column-to-function
 * map a repeated pair was unrepresentable, and a list admits it (#831).
 *
 * The refusal is **whole** — never truncated to the cap, never de-duplicated.
 * Keys are ordered and the order is the query's nesting order, so either repair
 * answers a different question from the one asked; a de-duplicated aggregate
 * list is the same kind of silent correction, and a consumer who sent a
 * duplicate asked for something this table cannot render and is better told than
 * quietly fixed. That is the same reasoning `resolveTableGroupingUpdate` and
 * `sanitizeGroupingByColumns` refuse whole for.
 *
 * The *question* is shared and the *answer* is not: an update on an illegal list
 * is `unchanged`, leaving the applied grouping alone, while a seed has no prior
 * state to leave alone and can only answer no grouping.
 *
 * The mode goes with them too, defaulting to `flat`: a route that never offers
 * the choice, and every link written before rollup existed, both mean the one
 * grouping set they have always meant.
 *
 * Aggregates go with the keys. An aggregate is computed per group, so with no
 * key there is nothing for it to describe — the same normalisation
 * `resolveTableGroupingUpdate` applies when the last key is removed.
 */
export const getInitialGroupingState = ({
  groupingAggregates = [],
  groupingKeys = [],
  groupingMode = 'flat',
  groupingPeriods = {},
  groupingShares = [],
}: GetInitialGroupingStateArgs): TableGroupingState => {
  if (
    groupingKeys.length === 0 ||
    !areGroupKeysLegal(groupingKeys) ||
    !areGroupAggregatesLegal(groupingAggregates)
  ) {
    return NO_GROUPING;
  }

  return {
    aggregates: [...groupingAggregates],
    keys: [...groupingKeys],
    mode: groupingMode,
    // Pruned to the keys that survived, so a granularity for a key the loader
    // did not apply cannot reach the server, which refuses one (#786).
    periods: pruneGroupPeriods({
      keys: groupingKeys,
      periods: groupingPeriods,
    }),
    // Pruned to the aggregates the loader actually applied, and only the
    // shareable ones: a share is a ratio over a measure, so one naming a
    // measure that is not there divides nothing (#648, per aggregate since
    // #831).
    shares: pruneGroupShares({
      aggregates: groupingAggregates,
      shares: groupingShares,
    }),
  };
};
