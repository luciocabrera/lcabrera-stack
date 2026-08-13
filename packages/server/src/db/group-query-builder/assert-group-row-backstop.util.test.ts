import { describe, expect, it } from 'vite-plus/test';

import { GroupingRefusedError } from '../../errors/grouping-refused.error.ts';
import { assertGroupRowBackstop } from './assert-group-row-backstop.util.ts';

describe('assertGroupRowBackstop', () => {
  it('passes a result short of the backstop', () => {
    expect(() =>
      assertGroupRowBackstop({
        rowCount: 5000,
        rowLimit: { backstopAt: 5001, limit: 5001 },
      }),
    ).not.toThrow();
  });

  it('refuses a result that reached the backstop', () => {
    // Returning it would be worse than refusing: the missing rows take their
    // subtotals with them, so a truncated grouped result reads exactly like a
    // correct one.
    expect(() =>
      assertGroupRowBackstop({
        rowCount: 5001,
        rowLimit: { backstopAt: 5001, limit: 5001 },
      }),
    ).toThrow('past the ceiling');
  });

  it('carries the typed reason for the loader edge', () => {
    let caught: unknown;

    try {
      assertGroupRowBackstop({
        rowCount: 5001,
        rowLimit: { backstopAt: 5001, limit: 5001 },
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(GroupingRefusedError);
    expect(caught).toMatchObject({
      estimatedRows: 5001,
      reason: 'row-limit-reached',
    });
  });

  it('does nothing when no backstop was set, even at the limit', () => {
    // A caller that asked for at most 400 rows and got 400 got what it asked
    // for. Refusing there would turn every deliberate ceiling into an error.
    expect(() =>
      assertGroupRowBackstop({ rowCount: 400, rowLimit: { limit: 400 } }),
    ).not.toThrow();
  });
});
