import type {
  TableAggregateFn,
  TableGroupingState,
} from '#ui/components/Table/Table.types';

import { MAX_TABLE_GROUP_KEYS } from '#ui/components/Table/Table.constants';

type GetInitialGroupingStateArgs = {
  readonly groupingAggregates?: Readonly<Record<string, TableAggregateFn>>;
  readonly groupingKeys?: readonly string[];
};

const NO_GROUPING: TableGroupingState = { aggregates: {}, keys: [] };

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
 * **This is a write path, and it enforces the depth cap itself.** A route built
 * on `createTableRouteLoader` cannot reach it over-cap — `sanitizeGroupingByColumns`
 * already refused — but `@lcabrera/ui` is published, and a consumer writing
 * their own loader is the intended use rather than an edge case. Without this
 * guard such a route seeds a store the package then renders as grouped, and the
 * query throws at `assertGroupKeys`: a 500 out of a state the package itself
 * accepted.
 *
 * The refusal is **whole**, never a truncation to the cap. Keys are ordered and
 * the order is the query's nesting order, so a truncated list answers a
 * different question from the one asked — the same reasoning
 * `resolveTableGroupingUpdate` and `sanitizeGroupingByColumns` refuse whole for.
 *
 * It reads `MAX_TABLE_GROUP_KEYS` directly rather than sharing a helper with
 * `resolveTableGroupingUpdate`, because the two refusals are not the same
 * answer: an *update* past the cap is `unchanged`, leaving the applied grouping
 * alone, while a *seed* past the cap has no prior state to leave alone, so no
 * grouping is the only whole refusal available.
 *
 * Aggregates go with the keys. An aggregate is computed per group, so with no
 * key there is nothing for it to describe — the same normalisation
 * `resolveTableGroupingUpdate` applies when the last key is removed.
 */
export const getInitialGroupingState = ({
  groupingAggregates = {},
  groupingKeys = [],
}: GetInitialGroupingStateArgs): TableGroupingState => {
  if (groupingKeys.length === 0 || groupingKeys.length > MAX_TABLE_GROUP_KEYS) {
    return NO_GROUPING;
  }

  return {
    aggregates: { ...groupingAggregates },
    keys: [...groupingKeys],
  };
};
