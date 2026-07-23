import { describe, expect, it } from 'vite-plus/test';

import { toError } from './to-error.util';

describe('toError', () => {
  it('returns Error instances unchanged', () => {
    const original = new Error('boom');

    expect(toError(original)).toBe(original);
  });

  it('wraps a string in an Error with the string as message', () => {
    const error = toError('stream failed');

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('stream failed');
  });

  it('serializes plain objects into the Error message', () => {
    const error = toError({ code: 500, reason: 'shell' });

    expect(error.message).toBe('{"code":500,"reason":"shell"}');
  });

  it.each([
    { label: 'undefined', value: undefined },
    { label: 'a number', value: 42 },
  ])('falls back to a generic message for $label', ({ value }) => {
    expect(toError(value).message).toBe('Unknown server-side streaming error');
  });
});
