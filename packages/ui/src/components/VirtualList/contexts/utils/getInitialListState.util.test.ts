import { describe, expect, it } from 'vite-plus/test';

import { getInitialListState } from './getInitialListState.util';

describe('getInitialListState', () => {
  it('mirrors the flags, derives the fetch flags, and defaults the UI fields', () => {
    expect(
      getInitialListState({
        hasCheckboxes: false,
        hasSelectAll: true,
        listMaxHeight: '12rem',
        name: 'country-filter',
        onChange: () => {},
        onFetchMore: () => {},
        shouldFillHeight: false,
      }),
    ).toEqual({
      hasCheckboxes: false,
      hasFetchInitial: false,
      hasFetchMore: true,
      hasSelectAll: true,
      listFilterMode: 'all',
      listMaxHeight: '12rem',
      name: 'country-filter',
      searchTerm: '',
      shouldFillHeight: false,
    });
  });

  it('reports both fetch flags when both callbacks are provided', () => {
    expect(
      getInitialListState({
        hasCheckboxes: true,
        hasSelectAll: false,
        listMaxHeight: '18.75rem',
        onChange: () => {},
        onFetchInitial: () => {},
        onFetchMore: () => {},
        shouldFillHeight: true,
      }),
    ).toEqual({
      hasCheckboxes: true,
      hasFetchInitial: true,
      hasFetchMore: true,
      hasSelectAll: false,
      listFilterMode: 'all',
      listMaxHeight: '18.75rem',
      name: undefined,
      searchTerm: '',
      shouldFillHeight: true,
    });
  });

  it('applies the default flags and layout when only onChange is provided', () => {
    expect(getInitialListState({ onChange: () => {} })).toEqual({
      hasCheckboxes: true,
      hasFetchInitial: false,
      hasFetchMore: false,
      hasSelectAll: true,
      listFilterMode: 'all',
      listMaxHeight: '18.75rem',
      name: undefined,
      searchTerm: '',
      shouldFillHeight: false,
    });
  });

  it('preserves the current UI fields so a config re-sync never clobbers them', () => {
    expect(
      getInitialListState({
        listFilterMode: 'selected',
        onChange: () => {},
        searchTerm: 'ban',
      }),
    ).toMatchObject({
      listFilterMode: 'selected',
      searchTerm: 'ban',
    });
  });
});
