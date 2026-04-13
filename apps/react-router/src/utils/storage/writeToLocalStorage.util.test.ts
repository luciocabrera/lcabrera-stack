import { afterEach, describe, expect, it, vi } from 'vitest';

import { writeToLocalStorage } from './writeToLocalStorage.util.ts';

describe('writeToLocalStorage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls localStorage.setItem', () => {
    const setItem = vi.fn();
    vi.stubGlobal('localStorage', { setItem });
    writeToLocalStorage({ key: 'theme', value: 'dark' });
    expect(setItem).toHaveBeenCalledWith('theme', 'dark');
  });

  it('does nothing when localStorage is undefined', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(() => writeToLocalStorage({ key: 'k', value: 'v' })).not.toThrow();
  });

  it('silently swallows storage errors', () => {
    const setItem = vi.fn(() => {
      throw new Error('QuotaExceededError');
    });
    vi.stubGlobal('localStorage', { setItem });
    expect(() => writeToLocalStorage({ key: 'k', value: 'v' })).not.toThrow();
  });
});
