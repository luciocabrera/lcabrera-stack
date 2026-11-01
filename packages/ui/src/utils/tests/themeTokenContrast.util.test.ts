import { describe, expect, it } from 'vite-plus/test';

import { colors } from '#ui/design-system/tokens/colors.stylex';

import {
  getColorTokenName,
  getLuminance,
  getThemeTokenContrast,
  readThemeValue,
} from './themeTokenContrast.util';

describe('getColorTokenName', () => {
  it('names the token a compiled variable belongs to', () => {
    expect(getColorTokenName(colors.textSecondary)).toBe('textSecondary');
  });

  it('refuses a value that is not a colour token', () => {
    expect(() => getColorTokenName('var(--unknown)')).toThrow(
      'var(--unknown) is not a colour token',
    );
  });
});

describe('readThemeValue', () => {
  it('reads the value a theme assigns, skipping a commented-out line', () => {
    expect(readThemeValue({ name: 'brandPrimary', theme: 'light' })).toBe(
      '#ffffff00',
    );
    expect(readThemeValue({ name: 'textPrimary', theme: 'dark' })).toBe(
      'oklch(92% 0.01 250)',
    );
  });

  it('refuses a token the theme does not assign', () => {
    expect(() =>
      readThemeValue({ name: 'missingToken', theme: 'dark' }),
    ).toThrow('The dark theme assigns no value to missingToken');
  });
});

describe('getLuminance', () => {
  it.each([
    { expected: 1, value: 'oklch(100% 0 0)' },
    { expected: 1, value: 'oklch(1 0 0)' },
    { expected: 0, value: 'oklch(0% 0 0)' },
    { expected: 1, value: 'lab(100 0 0)' },
    { expected: 1, value: 'lab(100% 0 0)' },
    { expected: 0.184186, value: 'lab(50 0 0)' },
    { expected: 0.005536, value: 'lab(5 0 0)' },
  ])('reads $value as luminance $expected', ({ expected, value }) => {
    expect(getLuminance(value)).toBeCloseTo(expected, 4);
  });

  it('counts chroma and hue in an oklch colour', () => {
    expect(getLuminance('oklch(62.8% 0.2577 29.23)')).toBeCloseTo(0.2126, 2);
    expect(getLuminance('oklch(45.2% 0.3132 264.05)')).toBeCloseTo(0.0722, 2);
  });

  it.each([
    'oklch(from brandPrimary l+0.10 c+0.05)',
    'oklch(92% 0.03 25 / 0.32)',
    'lab(12 34.23)',
    '#ffffff00',
  ])('refuses %s', (value) => {
    expect(() => getLuminance(value)).toThrow(value);
  });
});

describe('getThemeTokenContrast', () => {
  it('measures the same ratio whichever token is the lighter one', () => {
    const forward = getThemeTokenContrast({
      background: colors.backgroundPrimary,
      foreground: colors.textPrimary,
      theme: 'dark',
    });
    const reversed = getThemeTokenContrast({
      background: colors.textPrimary,
      foreground: colors.backgroundPrimary,
      theme: 'dark',
    });

    expect(forward).toBeGreaterThan(1);
    expect(forward).toBeCloseTo(reversed, 10);
  });

  it('reports 1 for a token against itself', () => {
    expect(
      getThemeTokenContrast({
        background: colors.backgroundPrimary,
        foreground: colors.backgroundPrimary,
        theme: 'light',
      }),
    ).toBeCloseTo(1, 10);
  });
});
