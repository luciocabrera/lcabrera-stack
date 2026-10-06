import { describe, expect, it } from 'vite-plus/test';

import { isTableCellBadgeRule } from './isTableCellBadgeRule.util';

describe('isTableCellBadgeRule', () => {
  it('narrows a well-formed rule', () => {
    expect(isTableCellBadgeRule({ gte: 1, tone: 'success' })).toBe(true);
  });

  it('refuses a malformed rule', () => {
    expect(isTableCellBadgeRule({ gte: 1 })).toBe(false);
  });
});
