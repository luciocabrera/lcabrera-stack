import { describe, expect, it } from 'vite-plus/test';

import { buildPaginatedQueryParams } from './build-paginated-query-params.util.ts';

describe('buildPaginatedQueryParams', () => {
  it('always includes limit and skip', () => {
    const params = buildPaginatedQueryParams({ limit: 25, skip: 50 });

    expect(params.get('limit')).toBe('25');
    expect(params.get('skip')).toBe('50');
    expect(params.has('sort')).toBe(false);
    expect(params.has('filter')).toBe(false);
  });

  it('appends the sorting payload when sorting is non-empty', () => {
    const sorting = [{ columnKey: 'name', direction: 'asc' as const }];

    const params = buildPaginatedQueryParams({ limit: 10, skip: 0, sorting });

    expect(params.get('sort')).toBe(JSON.stringify(sorting));
  });

  it('omits sort for an empty sorting array', () => {
    const params = buildPaginatedQueryParams({
      limit: 10,
      skip: 0,
      sorting: [],
    });

    expect(params.has('sort')).toBe(false);
  });

  it('appends the filter payload when the filter object has keys', () => {
    const filter = { status: 'active' };

    const params = buildPaginatedQueryParams({ filter, limit: 10, skip: 0 });

    expect(params.get('filter')).toBe(JSON.stringify(filter));
  });

  it('omits filter for empty objects and non-object values', () => {
    expect(
      buildPaginatedQueryParams({ filter: {}, limit: 10, skip: 0 }).has(
        'filter',
      ),
    ).toBe(false);
    expect(
      buildPaginatedQueryParams({ filter: 'raw', limit: 10, skip: 0 }).has(
        'filter',
      ),
    ).toBe(false);
  });
});
