import { describe, expect, it } from 'vite-plus/test';

import { isTableTotalsPlacement } from './isTableTotalsPlacement.util';

describe('isTableTotalsPlacement', () => {
  it('admits every placement the package emits', () => {
    expect(isTableTotalsPlacement('first')).toBe(true);
    expect(isTableTotalsPlacement('last')).toBe(true);
  });

  it('refuses a token outside the vocabulary', () => {
    expect(isTableTotalsPlacement('ASC')).toBe(false);
    expect(isTableTotalsPlacement('')).toBe(false);
  });

  it('refuses a non-string', () => {
    expect(isTableTotalsPlacement(undefined)).toBe(false);
    expect(isTableTotalsPlacement(1)).toBe(false);
  });

  it('does not admit an inherited property through the prototype chain', () => {
    // `Object.hasOwn` rather than `in`, because the value arrives from a URL.
    expect(isTableTotalsPlacement('toString')).toBe(false);
    expect(isTableTotalsPlacement('constructor')).toBe(false);
  });
});
