import { describe, expect, it } from 'vitest';

import { serializeBooleanFilter } from './serializeBooleanFilter.util';

describe('serializeBooleanFilter', () => {
  it('returns true for a true boolean filter', () => {
    expect(
      serializeBooleanFilter({ filter: { type: 'boolean', value: true } }),
    ).toBe(true);
  });

  it('returns false for a false boolean filter', () => {
    expect(
      serializeBooleanFilter({ filter: { type: 'boolean', value: false } }),
    ).toBe(false);
  });
});
