import type { TableGroupAggregateValue } from '#ui/components/Table/Table.types';

type ResolveShareRatioArgs = {
  readonly denominator: number | undefined;
  readonly value: TableGroupAggregateValue['value'];
};

export const resolveShareRatio = ({
  denominator,
  value,
}: ResolveShareRatioArgs) => {
  if (denominator === undefined || denominator === 0) return;

  const numerator = typeof value === 'string' ? Number(value) : value;

  if (typeof numerator !== 'number' || !Number.isFinite(numerator)) return;

  return numerator / denominator;
};
