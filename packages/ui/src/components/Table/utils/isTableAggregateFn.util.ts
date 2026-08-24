import type { TableAggregateFn } from '../Table.types';

import { TABLE_AGGREGATE_LABELS } from '../Table.constants';

export const isTableAggregateFn = (value: unknown): value is TableAggregateFn =>
  typeof value === 'string' && Object.hasOwn(TABLE_AGGREGATE_LABELS, value);
