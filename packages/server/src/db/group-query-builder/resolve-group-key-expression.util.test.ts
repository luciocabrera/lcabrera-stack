import { describe, expect, it } from 'vite-plus/test';

import type { GroupKeyPeriod } from './group-query-builder.types.ts';

import { resolveGroupKeyExpression } from './resolve-group-key-expression.util.ts';

describe('resolveGroupKeyExpression', () => {
  it('is the quoted column when no granularity is asked for', () => {
    expect(resolveGroupKeyExpression({ key: 'order_date' })).toBe(
      '"order_date"',
    );
  });

  it('pins a timestamptz truncation to a stated zone, not the session', () => {
    expect(
      resolveGroupKeyExpression({
        key: 'order_timestamp',
        period: 'month',
        typeName: 'timestamptz',
      }),
    ).toBe(`date_trunc('month', "order_timestamp", 'UTC')`);
  });

  it('casts a zone-free column rather than letting it be promoted', () => {
    for (const typeName of ['date', 'timestamp']) {
      expect(
        resolveGroupKeyExpression({
          key: 'order_date',
          period: 'quarter',
          typeName,
        }),
      ).toBe(`date_trunc('quarter', "order_date"::timestamp)`);
    }
  });

  it('spells one truncation one way, because Postgres matches GROUPING syntactically', () => {
    const first = resolveGroupKeyExpression({
      key: 'order_date',
      period: 'year',
      typeName: 'date',
    });
    const second = resolveGroupKeyExpression({
      key: 'order_date',
      period: 'year',
      typeName: 'date',
    });

    expect(first).toBe(second);
  });

  it('quotes the identifier rather than interpolating it', () => {
    expect(
      resolveGroupKeyExpression({
        key: 'weird"name',
        period: 'day',
        typeName: 'date',
      }),
    ).toBe(`date_trunc('day', "weird""name"::timestamp)`);
  });

  it('throws on a granularity outside the vocabulary rather than emitting it', () => {
    const smuggled =
      "week'); DROP TABLE orders; --" as unknown as GroupKeyPeriod;

    expect(() =>
      resolveGroupKeyExpression({
        key: 'order_date',
        period: smuggled,
        typeName: 'date',
      }),
    ).toThrow('Unknown group-key granularity');
  });
});
