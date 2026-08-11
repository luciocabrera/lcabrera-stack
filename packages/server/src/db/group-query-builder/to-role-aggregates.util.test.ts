import { describe, expect, it } from 'vite-plus/test';

import { toRoleAggregates } from './to-role-aggregates.util.ts';

// The SQL names the catalogue actually reports for each type, taken from a live
// probe rather than guessed — `bool` genuinely has no `min`/`max` aggregate, and
// `jsonb` genuinely has only `count`.
const CATALOGUE = {
  bool: ['bool_and', 'bool_or', 'count'],
  date: ['count', 'max', 'min'],
  jsonb: ['count'],
  numeric: ['avg', 'count', 'max', 'min', 'sum'],
  text: ['count', 'max', 'min'],
} as const;

describe('toRoleAggregates', () => {
  it('offers a string dimension count, countDistinct, min and max', () => {
    expect(
      toRoleAggregates({
        availableSqlNames: CATALOGUE.text,
        role: 'dimension',
      }),
    ).toEqual(['count', 'countDistinct', 'max', 'min']);
  });

  // Gate 2 doing the work Gate 1's summary cannot: the role permits min/max for
  // every dimension, and Postgres defines neither for boolean.
  it('drops min and max for a boolean and keeps the boolean pair', () => {
    expect(
      toRoleAggregates({
        availableSqlNames: CATALOGUE.bool,
        role: 'dimension',
      }),
    ).toEqual(['boolAnd', 'boolOr', 'count', 'countDistinct']);
  });

  it('drops avg for a date, which Postgres has no aggregate for', () => {
    expect(
      toRoleAggregates({
        availableSqlNames: CATALOGUE.date,
        role: 'dimension',
      }),
    ).toEqual(['count', 'countDistinct', 'max', 'min']);
  });

  it('offers a fact the full numeric menu including sum and avg', () => {
    expect(
      toRoleAggregates({ availableSqlNames: CATALOGUE.numeric, role: 'fact' }),
    ).toEqual(['avg', 'count', 'countDistinct', 'max', 'min', 'sum']);
  });

  it('never offers the boolean pair to a fact, whatever the catalogue says', () => {
    expect(
      toRoleAggregates({
        availableSqlNames: [...CATALOGUE.numeric, 'bool_and', 'bool_or'],
        role: 'fact',
      }),
    ).not.toContain('boolAnd');
  });

  it('offers nothing for an unsupported column', () => {
    expect(
      toRoleAggregates({
        availableSqlNames: CATALOGUE.jsonb,
        role: 'unsupported',
      }),
    ).toEqual([]);
  });

  it('derives countDistinct from count rather than probing for it', () => {
    // `countDistinct` is `count(DISTINCT …)`, so the catalogue never reports a
    // separate name — offering it has to follow from `count` existing.
    expect(
      toRoleAggregates({ availableSqlNames: ['count'], role: 'dimension' }),
    ).toEqual(['count', 'countDistinct']);
  });
});
