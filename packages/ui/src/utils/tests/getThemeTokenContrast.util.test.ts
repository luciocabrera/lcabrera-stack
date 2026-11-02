import { describe, expect, it } from 'vite-plus/test';

import { colors } from '#ui/design-system/tokens/colors.stylex';

import { getThemeTokenContrast } from './getThemeTokenContrast.util';

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

  it('reads each theme separately', () => {
    expect(
      getThemeTokenContrast({
        background: colors.backgroundPrimary,
        foreground: colors.textTertiary,
        theme: 'light',
      }),
    ).not.toBeCloseTo(
      getThemeTokenContrast({
        background: colors.backgroundPrimary,
        foreground: colors.textTertiary,
        theme: 'dark',
      }),
      1,
    );
  });

  it('composites a translucent token over the surface before measuring it', () => {
    const overBackground = getThemeTokenContrast({
      background: colors.backgroundPrimary,
      foreground: colors.textPrimary,
      theme: 'light',
    });
    const overGreySurface = getThemeTokenContrast({
      background: colors.backgroundPrimary,
      foreground: colors.textPrimary,
      surface: colors.textTertiary,
      theme: 'light',
    });

    expect(overBackground).toBeGreaterThan(4.5);
    expect(overBackground).toBeLessThan(21);
    expect(overGreySurface).toBeGreaterThan(overBackground);
  });

  it('refuses a translucent surface', () => {
    expect(() =>
      getThemeTokenContrast({
        background: colors.backgroundPrimary,
        foreground: colors.textPrimary,
        surface: colors.successBackground,
        theme: 'dark',
      }),
    ).toThrow(
      `The dark theme's surface ${colors.successBackground} is translucent`,
    );
  });
});
