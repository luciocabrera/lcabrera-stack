import { describe, expect, it } from 'vite-plus/test';

import { findTableCellBadgeRuleIssue } from './findTableCellBadgeRuleIssue.util';

describe('findTableCellBadgeRuleIssue', () => {
  it.each([
    [{ gte: 4, tone: 'success' }],
    [{ gte: 2, lt: 3, tone: 'caution' }],
    [{ equals: 'shipped', tone: 'success' }],
    [{ equals: false, tone: 'error' }],
    [{ tone: 'info' }],
  ])('accepts %j', (rule) => {
    expect(findTableCellBadgeRuleIssue(rule)).toBeUndefined();
  });

  it.each([
    { message: 'a rule must be an object', rule: JSON.parse('null') },
    { message: 'unknown rule key "gt"', rule: { gt: 4, tone: 'success' } },
    { message: 'a rule needs a tone name', rule: { gte: 4 } },
    {
      message: 'gte and lt must be finite numbers',
      rule: { gte: '4', tone: 'success' },
    },
    {
      message: 'gte and lt must be finite numbers',
      rule: { lt: NaN, tone: 'success' },
    },
    {
      message: 'equals must be a string, a finite number or a boolean',
      rule: { equals: { a: 1 }, tone: 'success' },
    },
  ])('rejects $rule', ({ message, rule }) => {
    expect(findTableCellBadgeRuleIssue(rule)).toBe(message);
  });
});
