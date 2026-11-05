import { describe, expect, it } from 'vite-plus/test';

import { readThemeValue } from './readThemeValue.util';

describe('readThemeValue', () => {
  it('reads the value a theme assigns, skipping a commented-out line', () => {
    expect(readThemeValue({ name: 'brandPrimary', theme: 'light' })).toBe(
      '#ffffff00',
    );
    expect(readThemeValue({ name: 'brandPrimary', theme: 'dark' })).toBe(
      'lab(9.51012% -.812642 -2.82544)',
    );
  });

  it('reads each theme from its own source', () => {
    expect(readThemeValue({ name: 'textPrimary', theme: 'dark' })).toBe(
      'oklch(92% 0.01 250)',
    );
    expect(readThemeValue({ name: 'textPrimary', theme: 'light' })).toBe(
      'lab(12 34.23 -54.75 / 0.76)',
    );
  });

  it('does not match a token whose name only starts the same way', () => {
    expect(readThemeValue({ name: 'brandPrimaryHover', theme: 'light' })).toBe(
      'oklch(from brandPrimary l-0.05 c+0.01 h)',
    );
  });

  it('refuses a token the theme does not assign', () => {
    expect(() =>
      readThemeValue({ name: 'missingToken', theme: 'dark' }),
    ).toThrow('The dark theme assigns no value to missingToken');
  });
});
