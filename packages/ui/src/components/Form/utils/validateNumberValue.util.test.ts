import { describe, expect, it } from 'vitest';

import type { FieldClientValidation } from '@repo/ui/components/Form/Form.types';

import { validateNumberValue } from './validateNumberValue.util';

describe('validateNumberValue', () => {
  it('returns the message when the value is below min', () => {
    const validation: FieldClientValidation = { min: 18 };

    expect(
      validateNumberValue({ message: 'Too small', validation, value: 5 }),
    ).toBe('Too small');
  });

  it('returns the message when the value is above max', () => {
    const validation: FieldClientValidation = { max: 100 };

    expect(
      validateNumberValue({ message: 'Too big', validation, value: 150 }),
    ).toBe('Too big');
  });

  it('returns undefined when the value is within range', () => {
    const validation: FieldClientValidation = { max: 100, min: 18 };

    expect(
      validateNumberValue({ message: 'Invalid', validation, value: 42 }),
    ).toBeUndefined();
  });

  it('returns undefined at the inclusive min and max boundaries', () => {
    const validation: FieldClientValidation = { max: 100, min: 18 };

    expect(
      validateNumberValue({ message: 'Invalid', validation, value: 18 }),
    ).toBeUndefined();
    expect(
      validateNumberValue({ message: 'Invalid', validation, value: 100 }),
    ).toBeUndefined();
  });

  it('returns undefined when no number constraints are configured', () => {
    expect(
      validateNumberValue({ message: 'Invalid', validation: {}, value: 42 }),
    ).toBeUndefined();
  });
});
