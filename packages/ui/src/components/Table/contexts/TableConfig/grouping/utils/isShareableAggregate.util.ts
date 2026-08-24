import type { TableAggregateFn } from '#ui/components/Table/Table.types';

import { TABLE_SHAREABLE_AGGREGATE_FNS } from '#ui/components/Table/Table.constants';

/**
 * Only an **additive** measure has one, because the denominator is derived from the rows
 * the read returned rather than asked of the server (ADR-086): under `rollup` it is the
 * grand-total row, and under `flat` it is the leaves added up — which is the true total
 * only where adding the parts gives the whole.
 */
export const isShareableAggregate = (fn: TableAggregateFn) =>
  TABLE_SHAREABLE_AGGREGATE_FNS.includes(fn);
