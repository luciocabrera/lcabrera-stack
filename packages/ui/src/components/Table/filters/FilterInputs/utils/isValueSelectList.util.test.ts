import { describe, expect, it } from 'vite-plus/test';

import { isValueSelectList } from './isValueSelectList.util';

const baseArgs: Parameters<typeof isValueSelectList>[0] = {
  dataType: 'string' as const,
  filter: { type: 'select', values: [] },
  hasFetchableOptions: true,
  operator: 'equals',
};

describe('isValueSelectList', () => {
  it('is true for a string column filtered by equality from fetchable options', () => {
    expect(isValueSelectList(baseArgs)).toBe(true);
  });

  it('is false before the column has a filter, since no value input renders', () => {
    expect(isValueSelectList({ ...baseArgs, filter: undefined })).toBe(false);
  });

  it('is false for a column whose value input is not text', () => {
    expect(isValueSelectList({ ...baseArgs, dataType: 'number' })).toBe(false);
    expect(isValueSelectList({ ...baseArgs, dataType: 'date' })).toBe(false);
  });

  it('is false for an operator that takes free text', () => {
    expect(isValueSelectList({ ...baseArgs, operator: 'contains' })).toBe(
      false,
    );
  });

  it('is false for boolean and currency columns', () => {
    expect(isValueSelectList({ ...baseArgs, dataType: 'boolean' })).toBe(false);
    expect(isValueSelectList({ ...baseArgs, dataType: 'currency' })).toBe(
      false,
    );
  });
});
