import { expect, it } from 'vitest';

import { buildFieldValidation } from './buildFieldValidation.util';

it('returns an empty object when no rules are set', () => {
  expect(buildFieldValidation({})).toStrictEqual({});
});

it('includes only the rules that are provided', () => {
  expect(buildFieldValidation({ required: true })).toStrictEqual({
    clientValidation: { required: true },
  });
  expect(
    buildFieldValidation({ maxLength: 200, required: true }),
  ).toStrictEqual({ clientValidation: { maxLength: 200, required: true } });
});

it('carries a regex pattern through', () => {
  const pattern = /^x$/;

  expect(buildFieldValidation({ pattern, required: true })).toStrictEqual({
    clientValidation: { pattern, required: true },
  });
});

it('keeps an explicit min of 0', () => {
  expect(buildFieldValidation({ min: 0, required: true })).toStrictEqual({
    clientValidation: { min: 0, required: true },
  });
});
