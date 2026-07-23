import { describe, expect, it } from 'vite-plus/test';

import { createInitialFilter } from './createInitialFilter.util';

describe('createInitialFilter', () => {
  it('creates a checked boolean filter for boolean columns', () => {
    expect(createInitialFilter('boolean')).toEqual({
      type: 'boolean',
      value: true,
    });
  });

  it('creates an equals-zero number filter for number columns', () => {
    expect(createInitialFilter('number')).toEqual({
      operator: 'equals',
      type: 'number',
      value: 0,
    });
  });

  it('creates an equals-zero number filter for currency columns', () => {
    expect(createInitialFilter('currency')).toEqual({
      operator: 'equals',
      type: 'number',
      value: 0,
    });
  });

  it('creates an empty equals date filter for date columns', () => {
    expect(createInitialFilter('date')).toEqual({
      operator: 'equals',
      type: 'date',
      value: '',
    });
  });

  it('creates an empty equals text filter for string columns', () => {
    expect(createInitialFilter('string')).toEqual({
      operator: 'equals',
      type: 'text',
      value: '',
    });
  });

  it('falls back to an empty text filter when dataType is undefined', () => {
    expect(createInitialFilter()).toEqual({
      operator: 'equals',
      type: 'text',
      value: '',
    });
  });
});
