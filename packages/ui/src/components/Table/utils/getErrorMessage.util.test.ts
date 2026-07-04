import { describe, expect, it } from 'vitest';

import { getErrorMessage } from './getErrorMessage.util';

describe('getErrorMessage', () => {
  it('returns error.message when given an Error instance', () => {
    expect(getErrorMessage({ error: new Error('boom') })).toBe('boom');
  });

  it('returns the fallback when the value is not an Error', () => {
    expect(
      getErrorMessage({ error: 'string error', fallback: 'fallback' }),
    ).toBe('fallback');
    expect(getErrorMessage({ error: 42, fallback: 'fallback' })).toBe(
      'fallback',
    );
    expect(getErrorMessage({ error: undefined, fallback: 'fallback' })).toBe(
      'fallback',
    );
  });

  it('uses the default fallback when fallback is not provided', () => {
    expect(getErrorMessage({ error: 'something' })).toBe('An error occurred');
  });
});
