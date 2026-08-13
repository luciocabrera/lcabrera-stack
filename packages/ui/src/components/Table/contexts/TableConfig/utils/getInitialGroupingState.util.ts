import type {
  TableAggregateFn,
  TableGroupingMode,
  TableGroupingState,
} from '#ui/components/Table/Table.types';

import { areGroupKeysLegal } from '../grouping/utils';

type GetInitialGroupingStateArgs = {
  readonly groupingAggregates?: Readonly<Record<string, TableAggregateFn>>;
  readonly groupingKeys?: readonly string[];
  readonly groupingMode?: TableGroupingMode;
};

const NO_GROUPING: TableGroupingState = {
  aggregates: {},
  keys: [],
  mode: 'flat',
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
 * **This is a write path, and it checks the same key-list invariants the update
 * path does** — `areGroupKeysLegal`: within the depth cap, and no key repeated.
 * A route built on `createTableRouteLoader` cannot reach it with an illegal
 * list, because `sanitizeGroupingByColumns` already refused — but
 * `@lcabrera/ui` is published, and a consumer writing their own loader is the
 * intended use rather than an edge case. Without this guard such a route seeds a
 * store the package then renders as grouped, and the query throws at
 * `assertGroupKeys`: a 500 out of a state the package itself accepted.
 *
 * The refusal is **whole** — never truncated to the cap, never de-duplicated.
 * Keys are ordered and the order is the query's nesting order, so either repair
 * answers a different question from the one asked. That is the same reasoning
 * `resolveTableGroupingUpdate` and `sanitizeGroupingByColumns` refuse whole for.
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
  groupingAggregates = {},
  groupingKeys = [],
  groupingMode = 'flat',
}: GetInitialGroupingStateArgs): TableGroupingState => {
  if (groupingKeys.length === 0 || !areGroupKeysLegal(groupingKeys)) {
    return NO_GROUPING;
  }

  return {
    aggregates: { ...groupingAggregates },
    keys: [...groupingKeys],
    mode: groupingMode,
  };
};
