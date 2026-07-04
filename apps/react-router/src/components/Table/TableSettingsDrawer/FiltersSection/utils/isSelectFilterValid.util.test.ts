import { describe, expect, it } from 'vitest';

import { isSelectFilterValid } from './isSelectFilterValid.util';

describe('isSelectFilterValid', () => {
  it('returns false for select with empty values array', () => {
    expect(
      isSelectFilterValid({ operator: 'equals', type: 'select', values: [] }),
    ).toBe(false);
  });

  it('returns true for select with non-empty values array', () => {
    expect(
      isSelectFilterValid({
        operator: 'equals',
        type: 'select',
        values: ['Active'],
      }),
    ).toBe(true);
  });

  it('returns false when values array is present but empty even if value is set', () => {
    expect(
      isSelectFilterValid({
        operator: 'equals',
        type: 'select',
        value: 'Active',
        values: [],
      }),
    ).toBe(false);
  });

  it('returns false for multiSelect with empty values array', () => {
    expect(
      isSelectFilterValid({
        operator: 'equals',
        type: 'multiSelect',
        values: [],
      }),
    ).toBe(false);
  });

  it('returns true for multiSelect with non-empty values array', () => {
    expect(
      isSelectFilterValid({
        operator: 'equals',
        type: 'multiSelect',
        values: ['a'],
      }),
    ).toBe(true);
  });
});
