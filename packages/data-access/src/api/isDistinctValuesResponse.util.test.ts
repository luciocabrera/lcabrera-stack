import { describe, expect, it } from 'vitest';

import { isDistinctValuesResponse } from './isDistinctValuesResponse.util';

describe('isDistinctValuesResponse', () => {
  it('accepts a valid response', () => {
    expect(
      isDistinctValuesResponse({ hasMore: true, values: ['a', 'b'] }),
    ).toBe(true);
    expect(isDistinctValuesResponse({ hasMore: false, values: [] })).toBe(true);
  });

  it('rejects non-objects and objects without the members', () => {
    expect(isDistinctValuesResponse(undefined)).toBe(false);
    expect(isDistinctValuesResponse(JSON.parse('null'))).toBe(false);
    expect(isDistinctValuesResponse('values')).toBe(false);
    expect(isDistinctValuesResponse([])).toBe(false);
  });

  it('rejects missing or mistyped members', () => {
    expect(isDistinctValuesResponse({ values: ['a'] })).toBe(false);
    expect(isDistinctValuesResponse({ hasMore: true })).toBe(false);
    expect(isDistinctValuesResponse({ hasMore: 'yes', values: ['a'] })).toBe(
      false,
    );
    expect(isDistinctValuesResponse({ hasMore: true, values: [1, 2] })).toBe(
      false,
    );
  });
});
