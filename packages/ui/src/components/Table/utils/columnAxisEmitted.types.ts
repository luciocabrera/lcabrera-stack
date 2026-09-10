import type { TableAggregateFn } from '../Table.types';

export type ColumnAxisEmittedAggregate = {
  readonly alias: string;
  readonly axis?: { readonly value: unknown };
  readonly columnKey: string;
  readonly fn: TableAggregateFn;
};
