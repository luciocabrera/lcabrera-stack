import type { TableColumnAggregate } from '../Table.types';

export const countCountDistinct = (
  aggregates: readonly TableColumnAggregate[],
) => aggregates.filter((aggregate) => aggregate.fn === 'countDistinct').length;
