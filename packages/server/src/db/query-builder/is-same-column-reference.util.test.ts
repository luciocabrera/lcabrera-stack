import { describe, expect, it } from 'vite-plus/test';

import { isSameColumnReference } from './is-same-column-reference.util.ts';

describe('isSameColumnReference', () => {
  it('matches equal references of either form', () => {
    expect(isSameColumnReference({ left: 'id', right: 'id' })).toBe(true);
    expect(
      isSameColumnReference({
        left: { column: 'id', source: 'vendor' },
        right: { column: 'id', source: 'vendor' },
      }),
    ).toBe(true);
  });

  it('never matches a dotted string to a joined reference', () => {
    expect(
      isSameColumnReference({
        left: 'vendor.id',
        right: { column: 'id', source: 'vendor' },
      }),
    ).toBe(false);
  });

  it('tells two sources with the same column apart', () => {
    expect(
      isSameColumnReference({
        left: { column: 'id', source: 'vendor' },
        right: { column: 'id', source: 'buyer' },
      }),
    ).toBe(false);
  });
});
