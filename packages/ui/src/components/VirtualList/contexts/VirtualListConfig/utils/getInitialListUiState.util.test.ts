import { describe, expect, it } from 'vitest';

import { getInitialListUiState } from './getInitialListUiState.util';

describe('getInitialListUiState', () => {
  it('returns the default UI state', () => {
    expect(getInitialListUiState()).toEqual({
      listFilterMode: 'all',
      searchTerm: '',
    });
  });

  it('applies per-field overrides', () => {
    expect(getInitialListUiState({ listFilterMode: 'selected' })).toEqual({
      listFilterMode: 'selected',
      searchTerm: '',
    });
  });
});
