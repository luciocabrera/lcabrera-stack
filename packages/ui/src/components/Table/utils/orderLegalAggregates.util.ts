import type { TableAggregateFn } from '../Table.types';

import { TABLE_AGGREGATE_FNS } from '../Table.constants';

type OrderLegalAggregatesArgs = {
  /** What the catalogue said this column's type supports (ADR-058). */
  readonly legal: readonly TableAggregateFn[];
};

/**
 * The catalogue answers as a set — it is a `SELECT` over `pg_aggregate`, sorted by SQL
 * name — and a menu needs an order a user recognises: count first, arithmetic next,
 * extrema after.
 */
export const orderLegalAggregates = ({ legal }: OrderLegalAggregatesArgs) =>
  TABLE_AGGREGATE_FNS.filter((fn) => legal.includes(fn));
