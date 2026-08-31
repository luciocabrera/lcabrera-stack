import type { TableAggregateFn } from '../Table.types';

import { TABLE_AGGREGATE_FNS } from '../Table.constants';

type OrderLegalAggregatesArgs = {
  readonly legal: readonly TableAggregateFn[];
};

export const orderLegalAggregates = ({ legal }: OrderLegalAggregatesArgs) =>
  TABLE_AGGREGATE_FNS.filter((fn) => legal.includes(fn));
