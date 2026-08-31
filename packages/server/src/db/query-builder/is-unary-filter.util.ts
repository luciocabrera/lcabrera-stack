import type { QueryFilter, UnaryOperator } from './query-builder.types.ts';

export type UnaryQueryFilter = Extract<
  QueryFilter,
  { readonly operator: UnaryOperator }
>;

export const isUnaryFilter = (
  filter: QueryFilter,
): filter is UnaryQueryFilter =>
  filter.operator === 'isNotNull' || filter.operator === 'isNull';
