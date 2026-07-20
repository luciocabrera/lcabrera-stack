import { describe, expect, it } from 'vitest';

import { toFieldOptions } from './toFieldOptions.util';

describe('toFieldOptions', () => {
  it('maps each value to a { label, value } option', () => {
    expect(toFieldOptions(['Low', 'High'])).toStrictEqual([
      { label: 'Low', value: 'Low' },
      { label: 'High', value: 'High' },
    ]);
  });

  it('returns an empty array for no values', () => {
    expect(toFieldOptions([])).toStrictEqual([]);
  });
});
