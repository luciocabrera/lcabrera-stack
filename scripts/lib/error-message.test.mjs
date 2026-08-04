import { describe, expect, it } from 'vite-plus/test';

import { errorMessage } from './error-message.mjs';

// The whole point is the non-Error cases: `error.message` renders `undefined`
// for every one of them, which erases the failure output precisely when
// something unexpected happened.

describe('errorMessage', () => {
  it('uses an Error message', () => {
    expect(errorMessage(new Error('boom'))).toBe('boom');
  });

  // The fixture is built by clearing the message rather than constructing an
  // empty one: Biome's useErrorMessage rejects both `new TypeError('')` and the
  // no-arg form, and rightly — it governs how errors are AUTHORED. This is a
  // deliberately degenerate value being fed to the helper, not an error anyone
  // throws, and mutating it says exactly that.
  it('falls back to the name when an Error has no message', () => {
    const cleared = new TypeError('emptied on the next line');
    cleared.message = '';
    expect(errorMessage(cleared)).toBe('TypeError');
  });

  it('returns a thrown string as-is', () => {
    expect(errorMessage('plain failure')).toBe('plain failure');
  });

  it('renders a thrown object instead of undefined', () => {
    expect(errorMessage({ code: 'ENOENT' })).toBe(
      'non-Error thrown: {"code":"ENOENT"}',
    );
  });

  it('renders thrown null and undefined', () => {
    expect(errorMessage(null)).toBe('non-Error thrown: null');
    expect(errorMessage(undefined)).toBe('non-Error thrown: undefined');
  });

  it('survives a value JSON cannot serialise', () => {
    const circular = {};
    circular.self = circular;
    expect(errorMessage(circular)).toBe('unprintable failure value');
  });

  // A helper whose job is rescuing a failure message must not become the
  // failure. A throwing getter is contrived, but so is every input this exists
  // for — and here it would replace the original error with its own.
  it('does not throw when a message getter throws', () => {
    const hostile = new Error('x');
    Object.defineProperty(hostile, 'message', {
      get() {
        throw new Error('nested');
      },
    });
    expect(errorMessage(hostile)).toBe('unprintable failure value');
  });
});
