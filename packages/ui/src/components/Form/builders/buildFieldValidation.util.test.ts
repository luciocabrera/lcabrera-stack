import { describe, expect, it } from 'vitest';

import { buildFieldValidation } from './buildFieldValidation.util';

describe('buildFieldValidation', () => {
  it('returns an empty object when no rules are set', () => {
    expect(buildFieldValidation({})).toStrictEqual({});
  });

  it('includes every provided rule', () => {
    const pattern = /^x$/;

    expect(
      buildFieldValidation({
        max: 5,
        maxLength: 200,
        min: 0,
        minLength: 1,
        pattern,
        required: true,
      }),
    ).toStrictEqual({
      clientValidation: {
        max: 5,
        maxLength: 200,
        min: 0,
        minLength: 1,
        pattern,
        required: true,
      },
    });
  });

  it('drops the keys that are unset', () => {
    expect(buildFieldValidation({ required: true })).toStrictEqual({
      clientValidation: { required: true },
    });
  });

  it('keeps an explicit min of 0', () => {
    expect(buildFieldValidation({ min: 0 })).toStrictEqual({
      clientValidation: { min: 0 },
    });
  });
});
