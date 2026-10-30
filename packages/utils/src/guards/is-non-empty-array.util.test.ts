import { describe, expect, expectTypeOf, it } from 'vite-plus/test';

import { isNonEmptyArray } from './is-non-empty-array.util';

describe('isNonEmptyArray', () => {
  it('accepts an array with an element', () => {
    expect(isNonEmptyArray([0])).toBe(true);
  });

  it('refuses an empty array', () => {
    expect(isNonEmptyArray([])).toBe(false);
  });

  it('narrows to a tuple with a first element', () => {
    const values: readonly number[] = [3];

    expect(isNonEmptyArray(values)).toBe(true);

    if (isNonEmptyArray(values))
      expectTypeOf(values[0]).toEqualTypeOf<number>();
  });
});
