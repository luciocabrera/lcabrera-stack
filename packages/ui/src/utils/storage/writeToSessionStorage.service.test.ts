// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';

import { writeToSessionStorage } from './writeToSessionStorage.service';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('writeToSessionStorage', () => {
  it('writes a value to sessionStorage', () => {
    sessionStorage.clear();
    writeToSessionStorage({ key: 'myKey', value: 'myValue' });
    expect(sessionStorage.getItem('myKey')).toBe('myValue');
  });

  it('does nothing when sessionStorage.setItem throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new Error('quota exceeded');
    });
    // Should not throw
    expect(() => writeToSessionStorage({ key: 'k', value: 'v' })).not.toThrow();
  });
});
