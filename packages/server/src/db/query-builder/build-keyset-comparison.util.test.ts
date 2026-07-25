import { describe, expect, it } from 'vite-plus/test';

import { buildKeysetComparison } from './build-keyset-comparison.util.ts';

describe('buildKeysetComparison', () => {
  it('advances past a non-null value ascending, and past the NULL group with it', () => {
    expect(
      buildKeysetComparison({
        direction: 'asc',
        isNullValue: false,
        placeholder: '$1',
        quotedColumn: '"order_date"',
      }),
    ).toBe('("order_date" > $1 OR "order_date" IS NULL)');
  });

  it('has nothing to advance to past a null value ascending — NULLS LAST', () => {
    expect(
      buildKeysetComparison({
        direction: 'asc',
        isNullValue: true,
        placeholder: '$1',
        quotedColumn: '"order_date"',
      }),
    ).toBeUndefined();
  });

  it('advances past a non-null value descending without a NULL arm — they came first', () => {
    expect(
      buildKeysetComparison({
        direction: 'desc',
        isNullValue: false,
        placeholder: '$2',
        quotedColumn: '"order_date"',
      }),
    ).toBe('"order_date" < $2');
  });

  it('advances from a null value descending into every non-null row — NULLS FIRST', () => {
    expect(
      buildKeysetComparison({
        direction: 'desc',
        isNullValue: true,
        placeholder: '$2',
        quotedColumn: '"order_date"',
      }),
    ).toBe('"order_date" IS NOT NULL');
  });
});
