import { describe, expect, it } from 'vitest';

import { getInitialListConfigState } from './getInitialListConfigState.util';

describe('getInitialListConfigState', () => {
  it('mirrors the flags and derives the fetch-callback flags', () => {
    expect(
      getInitialListConfigState({
        hasCheckboxes: false,
        hasSelectAll: true,
        name: 'country-filter',
        onFetchMore: () => {},
      }),
    ).toEqual({
      hasCheckboxes: false,
      hasFetchInitial: false,
      hasFetchMore: true,
      hasSelectAll: true,
      name: 'country-filter',
    });
  });

  it('reports both fetch flags when both callbacks are provided', () => {
    expect(
      getInitialListConfigState({
        hasCheckboxes: true,
        hasSelectAll: false,
        onFetchInitial: () => {},
        onFetchMore: () => {},
      }),
    ).toEqual({
      hasCheckboxes: true,
      hasFetchInitial: true,
      hasFetchMore: true,
      hasSelectAll: false,
      name: undefined,
    });
  });
});
