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
        foreground: colors.textSecondary,
        theme: 'light',
      }),
    ).not.toBeCloseTo(
      getThemeTokenContrast({
        background: colors.backgroundPrimary,
        foreground: colors.textSecondary,
        theme: 'dark',
      }),
      1,
    );
  });

  it('leaves the contrast unchanged when the surface under an opaque background changes', () => {
    const overPage = getThemeTokenContrast({
      background: colors.backgroundSecondary,
      foreground: colors.textSecondary,
      theme: 'light',
    });
    const overGrey = getThemeTokenContrast({
      background: colors.backgroundSecondary,
      foreground: colors.textSecondary,
      surface: colors.textTertiary,
      theme: 'light',
    });

    expect(overGrey).toBeCloseTo(overPage, 10);
  });

  it('composites a translucent foreground over the background it is drawn on', () => {
    expect(
      getThemeTokenContrast({
        background: colors.backgroundSecondary,
        foreground: colors.textPrimary,
        theme: 'light',
      }),
    ).toBeCloseTo(7.75, 2);
  });

  it('composites a translucent background over the surface first', () => {
    const overPage = getThemeTokenContrast({
      background: colors.textPrimary,
      foreground: colors.brandPrimaryCardText,
      theme: 'light',
    });
    const overGrey = getThemeTokenContrast({
      background: colors.textPrimary,
      foreground: colors.brandPrimaryCardText,
      surface: colors.textTertiary,
      theme: 'light',
    });

    expect(overGrey).not.toBeCloseTo(overPage, 2);
  });

  it('composites a translucent surface over backgroundPrimary before laying the background on it', () => {
    expect(
      getThemeTokenContrast({
        background: colors.errorBackground,
        foreground: colors.errorCardText,
        surface: colors.surfaceElevated,
        theme: 'light',
      }),
    ).toBeCloseTo(6.815, 2);
  });

  it('measures over backgroundPrimary itself the same as with no surface named', () => {
    expect(
      getThemeTokenContrast({
        background: colors.errorBackground,
        foreground: colors.errorCardText,
        surface: colors.backgroundPrimary,
        theme: 'dark',
      }),
    ).toBeCloseTo(
      getThemeTokenContrast({
        background: colors.errorBackground,
        foreground: colors.errorCardText,
        theme: 'dark',
      }),
      10,
    );
  });
});
