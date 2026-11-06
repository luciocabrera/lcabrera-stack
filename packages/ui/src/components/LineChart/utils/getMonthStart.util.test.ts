import { describe, expect, it } from 'vite-plus/test';

import { getMonthStart } from './getMonthStart.util';

describe('getMonthStart', () => {
  it('returns the first UTC instant of a month index', () => {
    expect(getMonthStart(2026 * 12 + 10).toISOString()).toBe(
      '2026-11-01T00:00:00.000Z',
    );
  });
});
