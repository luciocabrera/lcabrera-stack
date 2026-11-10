import { describe, expect, it } from 'vite-plus/test';

import { shouldShowSelectList } from './shouldShowSelectList.util';

describe('shouldShowSelectList', () => {
  it('shows the option list for an equality operator on a column with fetchable options', () => {
    expect(
      shouldShowSelectList({ hasFetchableOptions: true, operator: 'equals' }),
    ).toBe(true);
    expect(
      shouldShowSelectList({
        hasFetchableOptions: true,
        operator: 'notEquals',
      }),
    ).toBe(true);
  });

  it('falls back to free text for any other operator', () => {
    expect(
      shouldShowSelectList({ hasFetchableOptions: true, operator: 'contains' }),
    ).toBe(false);
  });

  it('falls back to free text when the column has no options to fetch', () => {
    expect(
      shouldShowSelectList({ hasFetchableOptions: false, operator: 'equals' }),
    ).toBe(false);
  });
});
