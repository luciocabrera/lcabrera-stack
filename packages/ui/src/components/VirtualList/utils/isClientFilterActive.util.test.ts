import { describe, expect, it } from 'vite-plus/test';

import { isClientFilterActive } from './isClientFilterActive.util';

describe('isClientFilterActive', () => {
  it('is false when browsing (no search term, all mode)', () => {
    expect(
      isClientFilterActive({ listFilterMode: 'all', searchTerm: '' }),
    ).toBe(false);
  });

  it('is true when a search term is present', () => {
    expect(
      isClientFilterActive({ listFilterMode: 'all', searchTerm: 'ss' }),
    ).toBe(true);
  });

  it('is true in the selected filter mode', () => {
    expect(
      isClientFilterActive({ listFilterMode: 'selected', searchTerm: '' }),
    ).toBe(true);
  });

  it('is true in the unselected filter mode', () => {
    expect(
      isClientFilterActive({ listFilterMode: 'unselected', searchTerm: '' }),
    ).toBe(true);
  });
});
