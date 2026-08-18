import type { QueryFilter, UnaryOperator } from './query-builder.types.ts';

/** The `QueryFilter` arm that carries no value — `IS NULL` / `IS NOT NULL`. */
export type UnaryQueryFilter = Extract<
  QueryFilter,
  { readonly operator: UnaryOperator }
>;

/**
 * Whether a filter is one of the standalone null tests.
 *
 * A type predicate rather than a discriminant check written inline, and that is
 * forced rather than stylistic: excluding the unary operators by literal leaves
 * the arm in the union with a narrowed `operator`, so the binary arm downstream
 * is never reached and `filter.value` does not resolve. Probed both as one
 * disjunction and as two separate checks — neither subtracts the arm. Saying
 * `filter is UnaryQueryFilter` makes the negative branch `Exclude<…>`, which
 * does.
 */
export const isUnaryFilter = (
  filter: QueryFilter,
): filter is UnaryQueryFilter =>
  filter.operator === 'isNotNull' || filter.operator === 'isNull';
