import { describe, expect, it } from 'vite-plus/test';

import { resolvePeriodDistinctEstimate } from './resolve-period-distinct-estimate.util.ts';

const known = (value: number) => ({ kind: 'known', value }) as const;

describe('resolvePeriodDistinctEstimate', () => {
  it('bounds by the range, which is the whole point', () => {
    expect(
      resolvePeriodDistinctEstimate({
        estimate: known(1800),
        period: 'month',
        spanDays: 1799,
      }),
    ).toStrictEqual(known(60));
  });

  it('bounds by the raw estimate too, which the range alone gets wrong', () => {
    expect(
      resolvePeriodDistinctEstimate({
        estimate: known(3),
        period: 'month',
        spanDays: 400,
      }),
    ).toStrictEqual(known(3));
  });

  it('counts the periods at both ends of the range', () => {
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
    expect(
      resolvePeriodDistinctEstimate({
        estimate: { kind: 'undefinedDistinctness' },
        period: 'year',
        spanDays: 1799,
      }),
    ).toStrictEqual({ kind: 'undefinedDistinctness' });
  });
});
