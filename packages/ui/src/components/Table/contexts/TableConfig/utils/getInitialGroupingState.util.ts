import type {
  TableAggregateFn,
  TableGroupingState,
} from '#ui/components/Table/Table.types';

type GetInitialGroupingStateArgs = {
  readonly groupingAggregates?: Readonly<Record<string, TableAggregateFn>>;
  readonly groupingKeys?: readonly string[];
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
 */
export const getInitialGroupingState = ({
  groupingAggregates = {},
  groupingKeys = [],
}: GetInitialGroupingStateArgs): TableGroupingState => ({
  aggregates: { ...groupingAggregates },
  keys: [...groupingKeys],
});
