import type { TableColumnAggregate } from '../Table.types';

import { MAX_TABLE_COUNT_DISTINCT_AGGREGATES } from '../Table.constants';
import { countCountDistinct } from './countCountDistinct.util';

/**
 * Whether an aggregate list is one a grouped read can carry — the whole-request half of
 * grouping legality, and the only guard rail in `@lcabrera/server`'s
 * `group-query-builder.constants.ts` that a client surface can breach purely by what it
 * offers.
 * It is a property of the **request** — how many `countDistinct` aggregates every column
 * carries between them — so no per-column answer can decide it, and putting it in
 * `resolveOfferableAggregates` would mean lying about what that predicate answers (#842).
 */
export const isWithinCountDistinctBudget = (
  aggregates: readonly TableColumnAggregate[],
) => countCountDistinct(aggregates) <= MAX_TABLE_COUNT_DISTINCT_AGGREGATES;
