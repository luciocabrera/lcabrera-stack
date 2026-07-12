import { describe, expect, it } from 'vitest';

import { getInitialListDataState } from './getInitialListDataState.util';

const baseArgs = {
  dataState: {
    data: ['apple', 'banana'],
    hasMore: true,
    isLoading: false,
    isLoadingMore: true,
    totalCount: 10,
  },
  hasFetchInitial: false,
  hasSelectAll: true,
  listFilterMode: 'all' as const,
  searchTerm: '',
};

describe('getInitialListDataState', () => {
  it('mirrors the props and pre-computes the derived state', () => {
    expect(
      getInitialListDataState({
        ...baseArgs,
        filter: { type: 'select', values: ['banana'] },
      }),
    ).toEqual({
      contentMode: 'list',
      data: ['apple', 'banana'],
      filteredOptions: ['apple', 'banana'],
      hasMore: true,
      isAllSelected: false,
      isLoading: false,
      isLoadingMore: true,
      selectedValues: ['banana'],
      shouldShowSelectAll: true,
      totalCount: 10,
      totalItems: 3,
    });
  });

  it('defaults selectedValues to an empty list without a filter', () => {
    expect(getInitialListDataState(baseArgs).selectedValues).toEqual([]);
  });

  it('applies the search term to the derived state', () => {
    const state = getInitialListDataState({ ...baseArgs, searchTerm: 'an' });

    expect(state.filteredOptions).toEqual(['banana']);
    expect(state.shouldShowSelectAll).toBe(false);
    expect(state.totalItems).toBe(1);
  });
});
