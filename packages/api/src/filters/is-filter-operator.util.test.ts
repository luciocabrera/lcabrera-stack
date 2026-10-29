import { describe, expect, it } from 'vite-plus/test';

import { isFilterOperator } from './is-filter-operator.util.ts';

const operators = { equals: true, notEquals: true } as const;

describe('isFilterOperator', () => {
  it('accepts an operator the set names', () => {
    expect(isFilterOperator({ operators, value: 'notEquals' })).toBe(true);
  });

  it('rejects an operator the set does not name', () => {
    expect(isFilterOperator({ operators, value: 'contains' })).toBe(false);
  });

  it('rejects a key the set only inherits', () => {
    expect(isFilterOperator({ operators, value: 'toString' })).toBe(false);
  });

  it('rejects a value that is not a string', () => {
    expect(isFilterOperator({ operators, value: undefined })).toBe(false);
    expect(isFilterOperator({ operators, value: 1 })).toBe(false);
  });
});
