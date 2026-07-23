import { describe, expect, it } from 'vite-plus/test';

import { resolveListDerivedState } from './resolveListDerivedState.util';

const baseArgs = {
  data: ['apple', 'banana', 'cherry'],
  hasFetchInitial: false,
  hasSelectAll: true,
  isLoading: false,
  isLoadingMore: false,
  listFilterMode: 'all' as const,
  searchTerm: '',
  selectedValues: ['banana'],
};

describe('resolveListDerivedState', () => {
  it('derives the full list state for loaded options', () => {
    expect(resolveListDerivedState(baseArgs)).toEqual({
      contentMode: 'list',
      filteredOptions: ['apple', 'banana', 'cherry'],
      isAllSelected: false,
      shouldShowSelectAll: true,
      totalItems: 4,
    });
  });

  it('applies search term and filter mode to the derived options', () => {
    expect(resolveListDerivedState({ ...baseArgs, searchTerm: 'an' })).toEqual({
      contentMode: 'list',
      filteredOptions: ['banana'],
      isAllSelected: true,
      shouldShowSelectAll: false,
      totalItems: 1,
    });
    expect(
      resolveListDerivedState({ ...baseArgs, listFilterMode: 'unselected' }),
    ).toEqual({
      contentMode: 'list',
      filteredOptions: ['apple', 'cherry'],
      isAllSelected: false,
      shouldShowSelectAll: true,
      totalItems: 3,
    });
  });

  it('omits the select-all row when disabled or with a single option', () => {
    expect(
      resolveListDerivedState({ ...baseArgs, hasSelectAll: false }).totalItems,
    ).toBe(3);
    expect(
      resolveListDerivedState({ ...baseArgs, data: ['apple'] })
        .shouldShowSelectAll,
    ).toBe(false);
  });

  it('reports loading mode during the initial load or bootstrap', () => {
    expect(
      resolveListDerivedState({ ...baseArgs, data: [], isLoading: true })
        .contentMode,
    ).toBe('loading');
    expect(
      resolveListDerivedState({ ...baseArgs, data: [], hasFetchInitial: true })
        .contentMode,
    ).toBe('loading');
  });

  it('reports empty mode when nothing matches', () => {
    expect(
      resolveListDerivedState({ ...baseArgs, searchTerm: 'zzz' }).contentMode,
    ).toBe('empty');
  });
});
