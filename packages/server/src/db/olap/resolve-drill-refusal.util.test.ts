import { describe, expect, it } from 'vite-plus/test';

import { resolveDrillRefusal } from './resolve-drill-refusal.util.ts';

const groupKeys = ['city', 'status'];

const path = (...columns: readonly string[]) =>
  columns.map((columnKey) => ({ columnKey, value: 'x' }));

describe('resolveDrillRefusal', () => {
  it('answers nothing for a complete leaf, which is the drillable case', () => {
    expect(
      resolveDrillRefusal({
        group: { isSubtotal: false, path: path('city', 'status') },
        groupKeys,
      }),
    ).toBeUndefined();
  });

  it('names the grand total ahead of the subtotal it also is', () => {
    expect(
      resolveDrillRefusal({
        group: { isSubtotal: true, path: [] },
        groupKeys,
      }),
    ).toBe('grand-total');
  });

  it('refuses a subtotal', () => {
    expect(
      resolveDrillRefusal({
        group: { isSubtotal: true, path: path('city') },
        groupKeys,
      }),
    ).toBe('subtotal');
  });

  it('refuses a path shorter than the applied keys', () => {
    expect(
      resolveDrillRefusal({
        group: { isSubtotal: false, path: path('city') },
        groupKeys,
      }),
    ).toBe('incomplete-path');
  });
});
