import { describe, expect, it } from 'vitest';

import { readQueryValue } from './readQueryValue.util';

describe('readQueryValue', () => {
  it('returns a plain string value unchanged', () => {
    expect(readQueryValue('status')).toBe('status');
  });

  it('returns the first string from an array value', () => {
    expect(readQueryValue(['status', 'ignored'])).toBe('status');
  });

  it('returns undefined for unsupported values', () => {
    expect(readQueryValue([10, 'status'])).toBeUndefined();
    expect(readQueryValue({ status: 'paid' })).toBeUndefined();
  });
});
