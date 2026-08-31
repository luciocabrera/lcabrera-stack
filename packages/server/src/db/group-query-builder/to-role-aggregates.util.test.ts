import { describe, expect, it } from 'vite-plus/test';

import { toRoleAggregates } from './to-role-aggregates.util.ts';

const CATALOGUE = {
  bool: ['bool_and', 'bool_or', 'count'],
  date: ['count', 'max', 'min'],
  inet: ['count', 'max', 'min'],
  interval: ['avg', 'count', 'max', 'min', 'sum'],
  jsonb: ['count'],
  numeric: ['avg', 'count', 'max', 'min', 'sum'],
  text: ['count', 'max', 'min'],
  uuid: ['count'],
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

  it('gives an interval the full fact menu, unlike the date it resembles', () => {
    expect(
      toRoleAggregates({ availableSqlNames: CATALOGUE.interval, role: 'fact' }),
    ).toContain('sum');
    expect(
      toRoleAggregates({
        availableSqlNames: CATALOGUE.date,
        role: 'dimension',
      }),
    ).not.toContain('sum');
  });

  it('offers an inet dimension min and max but no sum', () => {
    expect(
      toRoleAggregates({
        availableSqlNames: CATALOGUE.inet,
        role: 'dimension',
      }),
    ).toEqual(['count', 'countDistinct', 'max', 'min']);
  });

  it('offers a uuid only the counts, since Postgres defines no min(uuid)', () => {
    expect(
      toRoleAggregates({
        availableSqlNames: CATALOGUE.uuid,
        role: 'dimension',
      }),
    ).toEqual(['count', 'countDistinct']);
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
    expect(
      toRoleAggregates({ availableSqlNames: ['count'], role: 'dimension' }),
    ).toEqual(['count', 'countDistinct']);
  });
});
