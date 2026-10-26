import { describe, expect, it } from 'vite-plus/test';

import { parseColumnFilters } from './parse-column-filters.util.ts';

const withFilter = (filter: string) => new URLSearchParams({ filter });

describe('parseColumnFilters', () => {
  it('reads an absent param as no filters', () => {
    expect(
      parseColumnFilters(new URLSearchParams({ limit: '10' })),
    ).toStrictEqual({ filters: {}, kind: 'parsed' });
  });

  it('returns every filter of a well-formed payload', () => {
    const filters = {
      region: { type: 'multiSelect', values: ['north'] },
      score: { operator: 'greaterThan', type: 'number', value: 3 },
    };

    const params = withFilter(JSON.stringify(filters));

    expect(parseColumnFilters(params)).toStrictEqual({
      filters,
      kind: 'parsed',
    });
  });

  it.each([
    { label: 'an empty string', raw: '' },
    { label: 'text that is not JSON', raw: '{bad' },
    { label: 'a JSON string', raw: '"nope"' },
    { label: 'a JSON array', raw: '[]' },
    { label: 'JSON null', raw: 'null' },
  ])('refuses $label as unreadable', ({ raw }) => {
    expect(parseColumnFilters(withFilter(raw))).toStrictEqual({
      kind: 'refused',
      reason: 'unreadable',
    });
  });

  it('refuses the payload and names the column whose filter is invalid', () => {
    const raw = JSON.stringify({
      region: { type: 'select', value: 'north' },
      score: { operator: 'greaterThan', type: 'number', value: 'three' },
    });

    expect(parseColumnFilters(withFilter(raw))).toStrictEqual({
      column: 'score',
      kind: 'refused',
      reason: 'invalid-filter',
    });
  });
});
