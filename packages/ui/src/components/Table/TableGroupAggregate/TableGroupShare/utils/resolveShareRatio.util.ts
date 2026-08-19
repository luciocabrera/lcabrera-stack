import type { TableGroupAggregateValue } from '#ui/components/Table/Table.types';

type ResolveShareRatioArgs = {
  readonly denominator: number | undefined;
  readonly value: TableGroupAggregateValue['value'];
};

/**
 * This row's measure over the grand total, or `undefined` when that quotient
 * does not exist.
 *
 * **Every refusal is a separate branch on purpose.** A missing denominator, a
 * zero one and an unreadable numerator are three different reasons, and each
 * would otherwise produce a number that renders: `x / undefined` is `NaN`,
 * `x / 0` is `Infinity`, and `Number('abc')` is `NaN` again. All three would
 * pass a `typeof === 'number'` check and reach the formatter, which prints
 * `NaN%` and `∞%` without complaint (#648).
 *
 * The numerator is converted from the string `pg` sends for a `numeric` or
 * `bigint`. That conversion is safe here for the reason it is safe in
 * `resolveShareDenominators`: the result is a ratio shown to one decimal place,
 * so a double carries far more precision than the answer displays — and the
 * value the cell *prints* is still the original string.
 */
export const resolveShareRatio = ({
  denominator,
  value,
}: ResolveShareRatioArgs) => {
  if (denominator === undefined || denominator === 0) return;

  const numerator = typeof value === 'string' ? Number(value) : value;

  if (typeof numerator !== 'number' || !Number.isFinite(numerator)) return;

  return numerator / denominator;
};
