import { describe, expect, it } from 'vite-plus/test';

import { readThemeTokenValue } from './readThemeTokenValue.util';

describe('readThemeTokenValue', () => {
  it('reads the value each theme assigns a token', () => {
    expect(readThemeTokenValue({ theme: 'light', token: 'textInverse' })).toBe(
      'lab(100 0 0)',
    );
    expect(readThemeTokenValue({ theme: 'dark', token: 'surfaceStripe' })).toBe(
      'oklch(100% 0 0 / 0.02)',
    );
  });

  it('skips an assignment that is commented out', () => {
    expect(readThemeTokenValue({ theme: 'dark', token: 'brandPrimary' })).toBe(
      'lab(9.51012% -.812642 -2.82544)',
    );
  });

  it('does not match a token whose name only starts with the one asked for', () => {
    expect(readThemeTokenValue({ theme: 'light', token: 'brandPrimary' })).toBe(
      '#ffffff00',
    );
  });

  it('throws for a token the theme does not assign', () => {
    expect(() =>
      readThemeTokenValue({ theme: 'light', token: 'notAToken' }),
    ).toThrow('The light theme assigns no value to notAToken');
  });
});
