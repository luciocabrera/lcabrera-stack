import { describe, expect, it } from 'vite-plus/test';

import { stringifyLeafValue } from './stringifyLeafValue.util';

describe('stringifyLeafValue', () => {
  it('returns strings unchanged', () => {
    expect(stringifyLeafValue('Ada')).toBe('Ada');
  });

  it('stringifies numbers and booleans', () => {
    expect(stringifyLeafValue(42)).toBe('42');
    expect(stringifyLeafValue(true)).toBe('true');
  });

  it('returns an empty string for non-primitive values', () => {
    expect(stringifyLeafValue({ a: 1 })).toBe('');
    expect(stringifyLeafValue(undefined)).toBe('');
  });
});
