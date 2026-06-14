import { describe, expect, it } from 'vitest';

import { getChangedPropKeys } from './getChangedPropKeys.util';

describe('getChangedPropKeys', () => {
  it('returns only keys whose values changed', () => {
    expect(
      getChangedPropKeys(
        { density: 'comfortable', page: 2, striped: false },
        { density: 'compact', page: 2, striped: false },
      ),
    ).toEqual(['density']);
  });

  it('returns an empty list when values are unchanged', () => {
    expect(
      getChangedPropKeys(
        { density: 'compact', striped: false },
        { density: 'compact', striped: false },
      ),
    ).toEqual([]);
  });
});
