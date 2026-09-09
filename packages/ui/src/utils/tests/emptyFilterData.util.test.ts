import { describe, expect, it } from 'vite-plus/test';

import { emptyFilterData } from './emptyFilterData.util';

describe('emptyFilterData', () => {
  it('returns an idle column slot with no error', () => {
    expect(emptyFilterData()).toEqual({
      data: [],
      error: undefined,
      hasMore: false,
      isLoading: false,
      isLoadingMore: false,
      totalLoadedRows: 0,
      totalRows: 0,
    });
  });
});
