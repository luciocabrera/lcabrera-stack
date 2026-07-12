import { describe, expect, it } from 'vitest';

import { areAllFiltersExpanded } from './areAllFiltersExpanded.util';

describe('areAllFiltersExpanded', () => {
  it('returns true when every filter key is expanded', () => {
    expect(
      areAllFiltersExpanded({
        expandedFilters: ['status', 'price'],
        filterKeys: ['status', 'price'],
      }),
    ).toBe(true);
  });

  it('returns false when some filter key is collapsed', () => {
    expect(
      areAllFiltersExpanded({
        expandedFilters: ['status'],
        filterKeys: ['status', 'price'],
      }),
    ).toBe(false);
  });

  it('returns false when there are no active filters', () => {
    expect(areAllFiltersExpanded({ expandedFilters: [], filterKeys: [] })).toBe(
      false,
    );
  });

  it('ignores stale expanded keys without active filters', () => {
    expect(
      areAllFiltersExpanded({
        expandedFilters: ['gone', 'status'],
        filterKeys: ['status'],
      }),
    ).toBe(true);
  });
});
