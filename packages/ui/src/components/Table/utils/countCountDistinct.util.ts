import type { TableColumnAggregate } from '../Table.types';

/**
 * How many `countDistinct` aggregates a list carries, across every column together.
 * A number rather than a verdict, because the two questions worth asking of it compare it
 * differently: `isWithinCountDistinctBudget` asks whether a list that already exists is
 * legal (`<=`), and `hasCountDistinctBudgetLeft` whether one more would fit (`<`).
 */
export const countCountDistinct = (
  aggregates: readonly TableColumnAggregate[],
) => aggregates.filter((aggregate) => aggregate.fn === 'countDistinct').length;
