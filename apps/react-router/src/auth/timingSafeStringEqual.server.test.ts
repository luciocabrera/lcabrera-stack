import { describe, expect, it } from 'vite-plus/test';

import { timingSafeStringEqual } from './timingSafeStringEqual.server';

describe('timingSafeStringEqual', () => {
  it('returns true for identical strings', () => {
    expect(timingSafeStringEqual({ a: 'abc123', b: 'abc123' })).toBe(true);
  });

  it('returns false for same-length but different strings', () => {
    expect(timingSafeStringEqual({ a: 'abc123', b: 'abc124' })).toBe(false);
  });

  it('returns false for different-length strings', () => {
    expect(timingSafeStringEqual({ a: 'abc', b: 'abcd' })).toBe(false);
  });

  it('returns true for two empty strings', () => {
    expect(timingSafeStringEqual({ a: '', b: '' })).toBe(true);
  });
});
