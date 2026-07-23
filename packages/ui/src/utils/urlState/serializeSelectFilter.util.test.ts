import { describe, expect, it } from 'vite-plus/test';

import { serializeSelectFilter } from './serializeSelectFilter.util';

describe('serializeSelectFilter', () => {
  it('returns values array for equals operator', () => {
    expect(
      serializeSelectFilter({
        filter: {
          operator: 'equals',
          type: 'select',
          values: ['Active', 'Inactive'],
        },
      }),
    ).toEqual(['Active', 'Inactive']);
  });

  it('returns ["!", ...values] for notEquals operator', () => {
    expect(
      serializeSelectFilter({
        filter: {
          operator: 'notEquals',
          type: 'select',
          values: ['Draft'],
        },
      }),
    ).toEqual(['!', 'Draft']);
  });

  it('falls back to [value] when values is absent but value is present', () => {
    expect(
      serializeSelectFilter({
        filter: { operator: 'equals', type: 'select', value: 'Active' },
      }),
    ).toEqual(['Active']);
  });

  it('returns empty array when both values and value are absent', () => {
    expect(
      serializeSelectFilter({
        filter: { operator: 'equals', type: 'select' },
      }),
    ).toEqual([]);
  });
});
