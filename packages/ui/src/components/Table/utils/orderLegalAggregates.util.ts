import type { TableAggregateFn } from '../Table.types';

import { TABLE_AGGREGATE_FNS } from '../Table.constants';

type OrderLegalAggregatesArgs = {
  /** What the catalogue said this column's type supports (ADR-058). */
  readonly legal: readonly TableAggregateFn[];
};

/**
 * The aggregates to offer for one column, in menu order.
 *
 * The catalogue answers as a set — it is a `SELECT` over `pg_aggregate`, sorted
 * by SQL name — and a menu needs an order a user recognises: count first,
 * arithmetic next, extrema after. Filtering the ordered vocabulary rather than
 * sorting the answer is also what drops a name this package does not know, so a
 * future server-side addition shows up as one missing entry rather than as an
 * unlabelled button.
 */
export const orderLegalAggregates = ({ legal }: OrderLegalAggregatesArgs) =>
  TABLE_AGGREGATE_FNS.filter((fn) => legal.includes(fn));
