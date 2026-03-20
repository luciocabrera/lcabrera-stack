import { describe, expect, it } from 'vitest';

import { getNextSortDirection } from './getNextSortDirection.util';

describe('getNextSortDirection', () => {
  it('returns asc when current is undefined', () => {
    expect(getNextSortDirection(undefined)).toBe('asc');
  });

  it('returns desc when current is asc', () => {
    expect(getNextSortDirection('asc')).toBe('desc');
  });

  it('returns undefined when current is desc', () => {
    expect(getNextSortDirection('desc')).toBeUndefined();
  });
});
