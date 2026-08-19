import { describe, expect, it } from 'vite-plus/test';

import { toGroupKeyColumnFilter } from './toGroupKeyColumnFilter.util';

/**
 * A NULL group key, taken from JSON rather than written as a literal — which is
 * also how one actually reaches the client, since a group summary crosses the
 * loader boundary as plain JSON.
 */
const NULL_KEY: unknown = JSON.parse('null');

describe('toGroupKeyColumnFilter', () => {
  it('restricts a text column to the key value', () => {
    expect(
      toGroupKeyColumnFilter({ dataType: 'string', value: 'Paris' }),
    ).toStrictEqual({ operator: 'equals', type: 'text', value: 'Paris' });
  });

  it('keeps a numeric key numeric even when it arrives as a string', () => {
    // JSON carries `bigint` and `numeric` as text, and the codec keys off
    // `type` — a text filter here compares a number column against a string.
    expect(
      toGroupKeyColumnFilter({ dataType: 'number', value: '42' }),
    ).toStrictEqual({ operator: 'equals', type: 'number', value: 42 });
  });

  it('treats currency as the numeric column it is', () => {
    expect(
      toGroupKeyColumnFilter({ dataType: 'currency', value: 10.5 }),
    ).toStrictEqual({ operator: 'equals', type: 'number', value: 10.5 });
  });

  it('refuses a numeric column whose key will not parse', () => {
    expect(
      toGroupKeyColumnFilter({ dataType: 'number', value: 'not-a-number' }),
    ).toBeUndefined();
  });

  it('serialises a date key as ISO', () => {
    expect(
      toGroupKeyColumnFilter({
        dataType: 'date',
        value: new Date('2026-08-19T00:00:00.000Z'),
      }),
    ).toStrictEqual({
      operator: 'equals',
      type: 'date',
      value: '2026-08-19T00:00:00.000Z',
    });
  });

  it('reads a boolean key from either spelling', () => {
    expect(
      toGroupKeyColumnFilter({ dataType: 'boolean', value: 'true' }),
    ).toStrictEqual({ type: 'boolean', value: true });
    expect(
      toGroupKeyColumnFilter({ dataType: 'boolean', value: false }),
    ).toStrictEqual({ type: 'boolean', value: false });
  });

  it('produces no filter for a NULL key', () => {
    // The vocabulary has no "is null" member, and the nearest expressible thing
    // matches nothing — so a hand-off would open a silently empty table on the
    // group a reader is most likely to click (ADR-079).
    expect(
      toGroupKeyColumnFilter({ dataType: 'string', value: NULL_KEY }),
    ).toBeUndefined();
  });

  it('falls back to text for a column that declares no type', () => {
    expect(
      toGroupKeyColumnFilter({ dataType: undefined, value: 'Paris' }),
    ).toStrictEqual({ operator: 'equals', type: 'text', value: 'Paris' });
  });

  it('produces no filter for an object-valued key', () => {
    // A jsonb or composite column is a legal group key, so this is reachable.
    // `String()` over one yields `[object Object]` — a filter matching nothing,
    // saying nothing about why.
    expect(
      toGroupKeyColumnFilter({ dataType: 'string', value: { nested: 1 } }),
    ).toBeUndefined();
  });

  it('refuses a date column whose key is neither a Date nor a string', () => {
    expect(
      toGroupKeyColumnFilter({ dataType: 'date', value: { nested: 1 } }),
    ).toBeUndefined();
  });

  it('accepts an already-ISO date key', () => {
    expect(
      toGroupKeyColumnFilter({ dataType: 'date', value: '2026-08-19' }),
    ).toStrictEqual({ operator: 'equals', type: 'date', value: '2026-08-19' });
  });
});
