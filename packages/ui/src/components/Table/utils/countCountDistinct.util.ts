import type { TableColumnAggregate } from '../Table.types';

/**
 * How many `countDistinct` aggregates a list carries, across every column
 * together.
 *
 * A number rather than a verdict, because the two questions worth asking of it
 * compare it differently: `isWithinCountDistinctBudget` asks whether a list that
 * already exists is legal (`<=`), and `hasCountDistinctBudgetLeft` whether one
 * more would fit (`<`). Counting once and comparing twice is what stops those
 * two drifting into one.
 *
 * Callers should reach for one of those two rather than for this: a bare count
 * at a call site is where the comparison is chosen by accident.
 */
export const countCountDistinct = (
  aggregates: readonly TableColumnAggregate[],
) => aggregates.filter((aggregate) => aggregate.fn === 'countDistinct').length;
