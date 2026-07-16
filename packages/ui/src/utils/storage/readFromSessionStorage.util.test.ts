// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';

import { readFromSessionStorage } from './readFromSessionStorage.util';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('readFromSessionStorage', () => {
  it('returns undefined when sessionStorage is not available (SSR guard)', () => {
    const original = Object.getOwnPropertyDescriptor(
      globalThis,
      'sessionStorage',
    );
    Object.defineProperty(globalThis, 'sessionStorage', {
      configurable: true,
      value: undefined,
    });

    expect(readFromSessionStorage({ key: 'test' })).toBeUndefined();

    if (original) Object.defineProperty(globalThis, 'sessionStorage', original);
  });

  it('returns undefined when the key does not exist', () => {
    sessionStorage.clear();
    expect(readFromSessionStorage({ key: 'missing' })).toBeUndefined();
  });

  it('returns the stored value when the key exists', () => {
    sessionStorage.setItem('foo', 'bar');
    expect(readFromSessionStorage({ key: 'foo' })).toBe('bar');
  });

  it('returns undefined when sessionStorage.getItem throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
      throw new Error('denied');
    });

    expect(readFromSessionStorage({ key: 'any' })).toBeUndefined();
  });
});
