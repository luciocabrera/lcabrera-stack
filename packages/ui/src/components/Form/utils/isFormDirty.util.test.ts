import { describe, expect, it } from 'vitest';

import { isFormDirty } from './isFormDirty.util';

type Values = { readonly name: string; readonly tags: string[] };

describe('isFormDirty', () => {
  it('returns false when values are unchanged', () => {
    const initialValues: Values = { name: 'Ada', tags: ['a', 'b'] };
    const currentValues: Values = { name: 'Ada', tags: ['a', 'b'] };

    expect(
      isFormDirty({
        accessors: ['name', 'tags'],
        currentValues,
        initialValues,
      }),
    ).toBe(false);
  });

  it('returns true when a primitive value changes', () => {
    expect(
      isFormDirty({
        accessors: ['name'],
        currentValues: { name: 'Grace', tags: [] },
        initialValues: { name: 'Ada', tags: [] },
      }),
    ).toBe(true);
  });

  it('treats a new array reference with the same values as clean', () => {
    const initialValues: Values = { name: 'Ada', tags: ['a', 'b'] };
    const currentValues: Values = {
      name: 'Ada',
      tags: [...initialValues.tags],
    };

    expect(
      isFormDirty({
        accessors: ['tags'],
        currentValues,
        initialValues,
      }),
    ).toBe(false);
  });

  it('returns true when an array value actually changes', () => {
    expect(
      isFormDirty({
        accessors: ['tags'],
        currentValues: { name: 'Ada', tags: ['a', 'b', 'c'] },
        initialValues: { name: 'Ada', tags: ['a', 'b'] },
      }),
    ).toBe(true);
  });
});
