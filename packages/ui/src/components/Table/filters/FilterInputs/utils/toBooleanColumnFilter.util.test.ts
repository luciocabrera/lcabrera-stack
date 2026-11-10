import { describe, expect, it } from 'vite-plus/test';

import { toBooleanColumnFilter } from './toBooleanColumnFilter.util';

describe('toBooleanColumnFilter', () => {
  it('keeps a boolean or an empty filter for a boolean column', () => {
    expect(toBooleanColumnFilter({ type: 'boolean', value: true })).toEqual({
      type: 'boolean',
      value: true,
    });
    expect(
      toBooleanColumnFilter({ operator: 'isEmpty', type: 'empty' }),
    ).toEqual({ operator: 'isEmpty', type: 'empty' });
  });

  it('drops any other filter and passes no filter through as none', () => {
    expect(
      toBooleanColumnFilter({ operator: 'contains', type: 'text', value: 'a' }),
    ).toBeUndefined();
    expect(toBooleanColumnFilter(undefined)).toBeUndefined();
  });
});
