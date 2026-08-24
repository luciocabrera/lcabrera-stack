import type { QueryFilter, UnaryOperator } from './query-builder.types.ts';

export type UnaryQueryFilter = Extract<
  QueryFilter,
  { readonly operator: UnaryOperator }
>;

/**
 * A type predicate rather than a discriminant check written inline, and that is forced
 * rather than stylistic: excluding the unary operators by literal leaves the arm in the
 * union with a narrowed `operator`, so the binary arm downstream is never reached and
 * `filter.value` does not resolve.
 */
export const isUnaryFilter = (
  filter: QueryFilter,
): filter is UnaryQueryFilter =>
  filter.operator === 'isNotNull' || filter.operator === 'isNull';
