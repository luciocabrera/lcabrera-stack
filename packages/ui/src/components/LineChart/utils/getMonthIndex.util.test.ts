import { describe, expect, it } from 'vite-plus/test';

import { getMonthIndex } from './getMonthIndex.util';

describe('getMonthIndex', () => {
  it('counts UTC months since year zero', () => {
    expect(getMonthIndex(Date.parse('2026-11-30T23:59:59Z'))).toBe(
      2026 * 12 + 10,
    );
  });
});
