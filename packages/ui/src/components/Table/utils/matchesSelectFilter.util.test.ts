import { describe, expect, it } from 'vite-plus/test';

import { matchesSelectFilter } from './matchesSelectFilter.util';

describe('matchesSelectFilter', () => {
  it('matches every row while nothing is chosen', () => {
    expect(
      matchesSelectFilter({ filter: { type: 'select' }, value: undefined }),
    ).toBe(true);
    expect(
      matchesSelectFilter({
        filter: { type: 'multiSelect', value: '', values: [] },
        value: 'a',
      }),
    ).toBe(true);
  });

  it('matches a single chosen value', () => {
    const filter = { type: 'select', value: 'open' } as const;

    expect(matchesSelectFilter({ filter, value: 'open' })).toBe(true);
    expect(matchesSelectFilter({ filter, value: 'closed' })).toBe(false);
  });

  it('matches any of several chosen values', () => {
    const filter = { type: 'multiSelect', values: ['1', '2'] } as const;

    expect(matchesSelectFilter({ filter, value: 2 })).toBe(true);
    expect(matchesSelectFilter({ filter, value: 3 })).toBe(false);
  });

  it('excludes the chosen values for notEquals', () => {
    const filter = {
      operator: 'notEquals',
      type: 'multiSelect',
      values: ['open'],
    } as const;

    expect(matchesSelectFilter({ filter, value: 'open' })).toBe(false);
    expect(matchesSelectFilter({ filter, value: 'closed' })).toBe(true);
  });

  it('never matches a missing value once something is chosen', () => {
    expect(
      matchesSelectFilter({
        filter: { operator: 'notEquals', type: 'select', value: 'open' },
        value: undefined,
      }),
    ).toBe(false);
  });
});
