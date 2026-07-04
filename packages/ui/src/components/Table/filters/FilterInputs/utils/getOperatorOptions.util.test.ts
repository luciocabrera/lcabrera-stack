import { describe, expect, it } from 'vitest';

import {
  DATE_OPERATORS,
  NUMBER_OPERATORS,
  TEXT_OPERATORS,
} from '@repo/ui/constants/filterOperators.constants';

import { getOperatorOptions } from './getOperatorOptions.util';

describe('getOperatorOptions', () => {
  it('returns NUMBER_OPERATORS for number dataType', () => {
    expect(getOperatorOptions({ dataType: 'number' })).toBe(NUMBER_OPERATORS);
  });

  it('returns NUMBER_OPERATORS for currency dataType', () => {
    expect(getOperatorOptions({ dataType: 'currency' })).toBe(NUMBER_OPERATORS);
  });

  it('returns DATE_OPERATORS for date dataType', () => {
    expect(getOperatorOptions({ dataType: 'date' })).toBe(DATE_OPERATORS);
  });

  it('returns TEXT_OPERATORS for string dataType', () => {
    expect(getOperatorOptions({ dataType: 'string' })).toBe(TEXT_OPERATORS);
  });

  it('returns TEXT_OPERATORS for undefined dataType', () => {
    expect(getOperatorOptions({ dataType: undefined })).toBe(TEXT_OPERATORS);
  });

  it('returns TEXT_OPERATORS for boolean dataType', () => {
    expect(getOperatorOptions({ dataType: 'boolean' })).toBe(TEXT_OPERATORS);
  });
});
