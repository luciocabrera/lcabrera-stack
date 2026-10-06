import { describe, expect, it } from 'vite-plus/test';

import { matchesTableCellBadgeRule } from './matchesTableCellBadgeRule.util';

describe('matchesTableCellBadgeRule', () => {
  it('includes the gte bound itself', () => {
    expect(
      matchesTableCellBadgeRule({ rule: { gte: 4, tone: 's' }, value: 4 }),
    ).toBe(true);
    expect(
      matchesTableCellBadgeRule({ rule: { gte: 4, tone: 's' }, value: 3.99 }),
    ).toBe(false);
  });

  it('excludes the lt bound itself', () => {
    expect(
      matchesTableCellBadgeRule({ rule: { lt: 2, tone: 's' }, value: 2 }),
    ).toBe(false);
    expect(
      matchesTableCellBadgeRule({ rule: { lt: 2, tone: 's' }, value: 1.99 }),
    ).toBe(true);
  });

  it('requires every condition a rule carries', () => {
    const rule = { gte: 2, lt: 3, tone: 's' };

    expect(matchesTableCellBadgeRule({ rule, value: 2.5 })).toBe(true);
    expect(matchesTableCellBadgeRule({ rule, value: 3 })).toBe(false);
  });

  it('reads a numeric string as a number', () => {
    expect(
      matchesTableCellBadgeRule({ rule: { gte: 3, tone: 's' }, value: '3.5' }),
    ).toBe(true);
  });

  it('never matches a numeric bound against a non-number', () => {
    expect(
      matchesTableCellBadgeRule({ rule: { gte: 0, tone: 's' }, value: 'n/a' }),
    ).toBe(false);
  });

  it('matches a categorical value with equals', () => {
    const rule = { equals: 'shipped', tone: 's' };

    expect(matchesTableCellBadgeRule({ rule, value: 'shipped' })).toBe(true);
    expect(matchesTableCellBadgeRule({ rule, value: 'pending' })).toBe(false);
  });

  it('compares a numeric equals by value', () => {
    expect(
      matchesTableCellBadgeRule({
        rule: { equals: 4, tone: 's' },
        value: '4.0',
      }),
    ).toBe(true);
  });

  it('compares a boolean equals', () => {
    expect(
      matchesTableCellBadgeRule({
        rule: { equals: true, tone: 's' },
        value: true,
      }),
    ).toBe(true);
    expect(
      matchesTableCellBadgeRule({
        rule: { equals: true, tone: 's' },
        value: false,
      }),
    ).toBe(false);
  });
});
