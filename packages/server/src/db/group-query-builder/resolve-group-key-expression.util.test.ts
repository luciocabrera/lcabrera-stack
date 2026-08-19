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
    // The two-argument form resolves against the session `TimeZone`, so the
    // same order falls in December for one caller and January for another.
    expect(
      resolveGroupKeyExpression({
        key: 'order_timestamp',
        period: 'month',
        typeName: 'timestamptz',
      }),
    ).toBe(`date_trunc('month', "order_timestamp", 'UTC')`);
  });

  it('casts a zone-free column rather than letting it be promoted', () => {
    // `date_trunc(field, date)` promotes through the session zone and hands
    // back a `timestamptz` whose rendering moves with the reader; the cast
    // keeps the whole expression zone-free.
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
    // Two spellings of the same truncation are two expressions to the planner,
    // and `GROUPING(x)` must match a `GROUP BY` expression exactly — which is
    // why the projection, the grouping sets and the ORDER BY all call this.
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
    // The last gate, not the first: the URL codec and `assertGroupKeys` both
    // refuse one earlier. It exists so a period that escaped both cannot reach
    // SQL as text.
    //
    // Asserted through the type rather than suppressed past it: the case being
    // tested is a value arriving at **runtime** that the type forbids, which is
    // exactly what a parsed URL can produce, so a double assertion states the
    // premise instead of silencing the checker.
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
