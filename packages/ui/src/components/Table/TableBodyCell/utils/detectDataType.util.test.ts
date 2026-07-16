import { describe, expect, it } from 'vitest';

import { detectDataType } from './detectDataType.util';

describe('detectDataType', () => {
  it('returns boolean for boolean values', () => {
    expect(detectDataType(true)).toBe('boolean');
    expect(detectDataType(false)).toBe('boolean');
  });

  it('returns number for numeric values', () => {
    expect(detectDataType(42)).toBe('number');
    expect(detectDataType(0)).toBe('number');
    expect(detectDataType(-5.5)).toBe('number');
  });

  it('returns currency for strings starting with currency symbols', () => {
    expect(detectDataType('$1,234.56')).toBe('currency');
    expect(detectDataType('€100')).toBe('currency');
    expect(detectDataType('£50')).toBe('currency');
    expect(detectDataType('¥1000')).toBe('currency');
    expect(detectDataType('₹500')).toBe('currency');
  });

  it('returns date for ISO date strings', () => {
    expect(detectDataType('2024-01-15')).toBe('date');
    expect(detectDataType('2024-01-15T10:00:00Z')).toBe('date');
  });

  it('returns string for regular strings', () => {
    expect(detectDataType('hello')).toBe('string');
    expect(detectDataType('Active')).toBe('string');
  });

  it('returns string for null, undefined, object', () => {
    expect(detectDataType(undefined)).toBe('string');
    expect(detectDataType(undefined)).toBe('string');
    expect(detectDataType({})).toBe('string');
  });
});
