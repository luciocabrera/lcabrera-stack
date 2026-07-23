import { describe, expect, it } from 'vite-plus/test';

import { resolveContentMode } from './resolveContentMode.util';

describe('resolveContentMode', () => {
  it('returns loading during the initial load regardless of counts', () => {
    expect(
      resolveContentMode({ filteredOptionsCount: 0, isInitialLoading: true }),
    ).toBe('loading');
  });

  it('returns empty when no options match and nothing is loading', () => {
    expect(
      resolveContentMode({ filteredOptionsCount: 0, isInitialLoading: false }),
    ).toBe('empty');
  });

  it('returns list when options are available', () => {
    expect(
      resolveContentMode({ filteredOptionsCount: 4, isInitialLoading: false }),
    ).toBe('list');
  });
});
