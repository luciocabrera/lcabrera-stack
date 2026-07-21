import { describe, expect, it } from 'vitest';

import { parseFilterOptionsParams } from './parse-filter-options-params.util.ts';

describe('parseFilterOptionsParams', () => {
  it('parses a complete query with explicit pagination', () => {
    const params = parseFilterOptionsParams({
      defaultPageSize: 50,
      searchParams: new URLSearchParams(
        'schemaName=public&tableName=car_sales&columnName=model&limit=25&offset=50',
      ),
    });

    expect(params).toEqual({
      columnName: 'model',
      limit: 25,
      offset: 50,
      schemaName: 'public',
      tableName: 'car_sales',
    });
  });

  it('falls back to the injected defaultPageSize when limit is absent', () => {
    const params = parseFilterOptionsParams({
      defaultPageSize: 25,
      searchParams: new URLSearchParams(
        'schemaName=public&tableName=car_sales&columnName=model',
      ),
    });

    expect(params).toEqual({
      columnName: 'model',
      limit: 25,
      offset: 0,
      schemaName: 'public',
      tableName: 'car_sales',
    });
  });

  it.each([
    'tableName=car_sales&columnName=model',
    'schemaName=public&columnName=model',
    'schemaName=public&tableName=car_sales',
  ])(
    'returns undefined when a required identifier is missing (%s)',
    (query) => {
      expect(
        parseFilterOptionsParams({
          defaultPageSize: 50,
          searchParams: new URLSearchParams(query),
        }),
      ).toBeUndefined();
    },
  );
});
