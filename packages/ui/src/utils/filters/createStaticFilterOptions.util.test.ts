import { describe, expect, it } from 'vitest';

import { createStaticFilterOptions } from './createStaticFilterOptions.util';

describe('createStaticFilterOptions', () => {
  const values = ['Pending', 'Shipped', 'Delivered'];

  it('emits a serializable static descriptor carrying the values', () => {
    const result = createStaticFilterOptions(values);

    expect(result).toEqual({
      filterOptionsDescriptor: {
        kind: 'static',
        values: ['Pending', 'Shipped', 'Delivered'],
      },
    });
  });

  it('contains no function members (loader-boundary safe)', () => {
    const result = createStaticFilterOptions(values);

    expect(
      Object.values(result.filterOptionsDescriptor ?? {}).every(
        (member) => typeof member !== 'function',
      ),
    ).toBe(true);
  });

  it('works with an empty values array', () => {
    const result = createStaticFilterOptions([]);

    expect(result.filterOptionsDescriptor).toEqual({
      kind: 'static',
      values: [],
    });
  });
});
