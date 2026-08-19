import { describe, expect, it } from 'vite-plus/test';

import { resolvePeriodDistinctEstimate } from './resolve-period-distinct-estimate.util.ts';

const known = (value: number) => ({ kind: 'known', value }) as const;

describe('resolvePeriodDistinctEstimate', () => {
  it('bounds by the range, which is the whole point', () => {
    // 1799 days of daily dates: the raw estimate says 1800 whatever period is
    // asked for, and only the span says how few months that is.
    expect(
      resolvePeriodDistinctEstimate({
        estimate: known(1800),
        period: 'month',
        spanDays: 1799,
      }),
    ).toStrictEqual(known(60));
  });

  it('bounds by the raw estimate too, which the range alone gets wrong', () => {
    // One day of data behind a million rows. The span arithmetic allows one
    // group; so does the raw count. A month of *sparse* data is the case that
    // separates them: 400 days spanning 14 months, but only 3 distinct dates in
    // it, so at most 3 months can be occupied.
    expect(
      resolvePeriodDistinctEstimate({
        estimate: known(3),
        period: 'month',
        spanDays: 400,
      }),
    ).toStrictEqual(known(3));
  });

  it('counts the periods at both ends of the range', () => {
    // A 31-day span crosses two months, not one — the `+ 1` is not padding.
    expect(
      resolvePeriodDistinctEstimate({
        estimate: known(1_000_000),
        period: 'month',
        spanDays: 31,
      }),
    ).toStrictEqual(known(2));
    expect(
      resolvePeriodDistinctEstimate({
        estimate: known(1_000_000),
        period: 'day',
        spanDays: 0,
      }),
    ).toStrictEqual(known(1));
  });

  it('upgrades an unknown raw estimate when the range is measurable', () => {
    // `unknown` is warn-and-proceed (ADR-066), but a column with a histogram
    // and no usable `n_distinct` still has a range — discarding it would leave
    // the guard blind on the one input it does have.
    expect(
      resolvePeriodDistinctEstimate({
        estimate: { kind: 'unknown' },
        period: 'year',
        spanDays: 3653,
      }),
    ).toStrictEqual(known(11));
  });

  it('answers the raw estimate untouched when there is no range', () => {
    expect(
      resolvePeriodDistinctEstimate({
        estimate: known(42),
        period: 'year',
        spanDays: undefined,
      }),
    ).toStrictEqual(known(42));
    expect(
      resolvePeriodDistinctEstimate({
        estimate: { kind: 'unknown' },
        period: 'year',
        spanDays: undefined,
      }),
    ).toStrictEqual({ kind: 'unknown' });
  });

  it('passes undefined distinctness through, because a period is not about equality', () => {
    // Postgres saying the type has no equality operator is a fact about the
    // column. Truncating it changes how many values there are, not whether they
    // compare — and it is refused a step later on exactly that ground.
    expect(
      resolvePeriodDistinctEstimate({
        estimate: { kind: 'undefinedDistinctness' },
        period: 'year',
        spanDays: 1799,
      }),
    ).toStrictEqual({ kind: 'undefinedDistinctness' });
  });
});
