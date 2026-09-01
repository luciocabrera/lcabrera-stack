import type { TableAggregateFn } from '#ui/components/Table/Table.types';

import { TABLE_SHAREABLE_AGGREGATE_FNS } from '#ui/components/Table/Table.constants';

export const isShareableAggregate = (fn: TableAggregateFn) =>
  TABLE_SHAREABLE_AGGREGATE_FNS.includes(fn);
