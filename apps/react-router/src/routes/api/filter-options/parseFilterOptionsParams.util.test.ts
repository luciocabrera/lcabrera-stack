import { describe, expect, it } from 'vitest';

import { parseFilterOptionsParams } from './parseFilterOptionsParams.util';

describe('parseFilterOptionsParams', () => {
  it('parses a complete query with explicit pagination', () => {
    const params = parseFilterOptionsParams(
      new URLSearchParams(
        'schemaName=public&tableName=car_sales&columnName=model&limit=25&offset=50',
      ),
    );

    expect(params).toEqual({
      columnName: 'model',
      limit: 25,
      offset: 50,
      schemaName: 'public',
      tableName: 'car_sales',
    });
  });

  it('applies pagination defaults when limit/offset are absent', () => {
    const params = parseFilterOptionsParams(
      new URLSearchParams(
        'schemaName=public&tableName=car_sales&columnName=model',
      ),
    );

    expect(params).toEqual({
      columnName: 'model',
      limit: 50,
      offset: 0,
      schemaName: 'public',
      tableName: 'car_sales',
    });
  });

  it('returns undefined when a required source identifier is missing', () => {
    expect(
      parseFilterOptionsParams(
        new URLSearchParams('tableName=car_sales&columnName=model'),
      ),
    ).toBeUndefined();
    expect(
      parseFilterOptionsParams(
        new URLSearchParams('schemaName=public&columnName=model'),
      ),
    ).toBeUndefined();
    expect(
      parseFilterOptionsParams(
        new URLSearchParams('schemaName=public&tableName=car_sales'),
      ),
    ).toBeUndefined();
  });
});
