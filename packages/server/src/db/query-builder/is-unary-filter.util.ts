import type {
  ComparisonOperator,
  UnaryOperator,
} from './query-builder.types.ts';

type Comparison = { readonly operator: ComparisonOperator };

export const isUnaryFilter = <TComparison extends Comparison>(
  filter: TComparison,
): filter is Extract<TComparison, { readonly operator: UnaryOperator }> =>
  filter.operator === 'isNotNull' || filter.operator === 'isNull';
