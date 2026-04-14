import { describe, expect, it } from 'vitest';

import { getOperatorFromFilter } from './getOperatorFromFilter.util';

describe('getOperatorFromFilter', () => {
  it('returns equals when filter is undefined', () => {
    expect(getOperatorFromFilter({ filter: undefined })).toBe('equals');
  });

  it('returns equals for boolean dataType regardless of filter', () => {
    expect(
      getOperatorFromFilter({
        dataType: 'boolean',
        filter: { operator: 'contains', type: 'text', value: 'x' },
      }),
    ).toBe('equals');
  });

  it('returns operator from filter when present', () => {
    expect(
      getOperatorFromFilter({
        filter: { operator: 'contains', type: 'text', value: 'hello' },
      }),
    ).toBe('contains');
  });

  it('returns equals when filter has no operator field', () => {
    expect(
      getOperatorFromFilter({
        filter: { type: 'boolean', value: true },
      }),
    ).toBe('equals');
  });
});
