import { describe, expect, it } from 'vitest';

import { resolveVirtualListBodyState } from './resolveVirtualListBodyState.util';

const baseArgs = {
  hasFetchInitial: false,
  hasSelectAll: false,
  listFilterMode: 'all' as const,
  searchTerm: '',
  selectedValues: [] as readonly string[],
};

const buildDataState = (
  partial: Partial<{
    data: readonly string[];
    hasMore: boolean;
    isLoading: boolean;
    isLoadingMore: boolean;
  }> = {},
) => ({
  data: [],
  hasMore: false,
  isLoading: false,
  isLoadingMore: false,
  ...partial,
});

describe('resolveVirtualListBodyState', () => {
  it('returns loading mode while initial data is loading', () => {
    const result = resolveVirtualListBodyState({
      ...baseArgs,
      dataState: buildDataState({ isLoading: true }),
    });

    expect(result.contentMode).toBe('loading');
    expect(result.isLoadingOptions).toBe(true);
  });

  it('returns loading mode while bootstrapping an initial fetch', () => {
    const result = resolveVirtualListBodyState({
      ...baseArgs,
      dataState: buildDataState(),
      hasFetchInitial: true,
    });

    expect(result.contentMode).toBe('loading');
  });

  it('returns empty mode when filtering produces zero options', () => {
    const result = resolveVirtualListBodyState({
      ...baseArgs,
      dataState: buildDataState({ data: ['apple'] }),
      searchTerm: 'zzz',
    });

    expect(result.contentMode).toBe('empty');
    expect(result.filteredOptions).toEqual([]);
  });

  it('returns list mode with derived counts when options are visible', () => {
    const result = resolveVirtualListBodyState({
      ...baseArgs,
      dataState: buildDataState({ data: ['apple', 'banana', 'cherry'] }),
      hasSelectAll: true,
      selectedValues: ['apple', 'banana'],
    });

    expect(result.contentMode).toBe('list');
    expect(result.shouldShowSelectAll).toBe(true);
    expect(result.totalItems).toBe(4);
    expect(result.isAllSelected).toBe(false);
  });

  it('marks all selected when every filtered option is selected', () => {
    const result = resolveVirtualListBodyState({
      ...baseArgs,
      dataState: buildDataState({ data: ['apple', 'banana'] }),
      selectedValues: ['apple', 'banana'],
    });

    expect(result.isAllSelected).toBe(true);
  });
});
