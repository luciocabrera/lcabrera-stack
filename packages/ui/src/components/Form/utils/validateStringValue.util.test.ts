import { describe, expect, it } from 'vitest';

import type { FieldClientValidation } from '@repo/ui/components/Form/Form.types';

import { validateStringValue } from './validateStringValue.util';

describe('validateStringValue', () => {
  it('returns the message when the value is shorter than minLength', () => {
    const validation: FieldClientValidation = { minLength: 3 };

    expect(
      validateStringValue({ message: 'Too short', validation, value: 'ab' }),
    ).toBe('Too short');
  });

  it('returns the message when the value is longer than maxLength', () => {
    const validation: FieldClientValidation = { maxLength: 3 };

    expect(
      validateStringValue({ message: 'Too long', validation, value: 'abcd' }),
    ).toBe('Too long');
  });

  it('returns the message when the value does not match the pattern', () => {
    const validation: FieldClientValidation = { pattern: '^[a-z]+$' };

    expect(
      validateStringValue({ message: 'Invalid', validation, value: 'ABC' }),
    ).toBe('Invalid');
  });

  it('returns undefined when the value satisfies every rule', () => {
    const validation: FieldClientValidation = {
      maxLength: 5,
      minLength: 2,
      pattern: '^[a-z]+$',
    };

    expect(
      validateStringValue({ message: 'Invalid', validation, value: 'abc' }),
    ).toBeUndefined();
  });

  it('returns undefined when no string constraints are configured', () => {
    expect(
      validateStringValue({ message: 'Invalid', validation: {}, value: 'abc' }),
    ).toBeUndefined();
  });
});
