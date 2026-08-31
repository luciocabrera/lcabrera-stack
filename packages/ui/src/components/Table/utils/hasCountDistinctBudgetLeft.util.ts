import type { TableColumnAggregate } from '../Table.types';

import { MAX_TABLE_COUNT_DISTINCT_AGGREGATES } from '../Table.constants';
import { countCountDistinct } from './countCountDistinct.util';

export const hasCountDistinctBudgetLeft = (
  aggregates: readonly TableColumnAggregate[],
) => countCountDistinct(aggregates) < MAX_TABLE_COUNT_DISTINCT_AGGREGATES;
