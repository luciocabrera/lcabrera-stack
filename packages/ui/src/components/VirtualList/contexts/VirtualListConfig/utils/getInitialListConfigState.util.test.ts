import { describe, expect, it } from 'vitest';

import { getInitialListConfigState } from './getInitialListConfigState.util';

describe('getInitialListConfigState', () => {
  it('mirrors the flags and derives the fetch-callback flags', () => {
    expect(
      getInitialListConfigState({
        hasCheckboxes: false,
        hasSelectAll: true,
        listMaxHeight: '12rem',
        name: 'country-filter',
        onFetchMore: () => {},
        shouldFillHeight: false,
      }),
    ).toEqual({
      hasCheckboxes: false,
      hasFetchInitial: false,
      hasFetchMore: true,
      hasSelectAll: true,
      listMaxHeight: '12rem',
      name: 'country-filter',
      shouldFillHeight: false,
    });
  });

  it('reports both fetch flags when both callbacks are provided', () => {
    expect(
      getInitialListConfigState({
        hasCheckboxes: true,
        hasSelectAll: false,
        listMaxHeight: '18.75rem',
        onFetchInitial: () => {},
        onFetchMore: () => {},
        shouldFillHeight: true,
      }),
    ).toEqual({
      hasCheckboxes: true,
      hasFetchInitial: true,
      hasFetchMore: true,
      hasSelectAll: false,
      listMaxHeight: '18.75rem',
      name: undefined,
      shouldFillHeight: true,
    });
  });
});
