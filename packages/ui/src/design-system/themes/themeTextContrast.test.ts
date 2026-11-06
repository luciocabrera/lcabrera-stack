import { describe, expect, it } from 'vite-plus/test';

import { colors } from '#ui/design-system/tokens/colors.stylex';
import { getThemeTokenContrast } from '#ui/utils/tests/getThemeTokenContrast.util';
import { isInSrgbGamut } from '#ui/utils/tests/isInSrgbGamut.util';
import { readThemeColors } from '#ui/utils/tests/readThemeColors.util';

const WCAG_AA_BODY_TEXT = 4.5;

const THEMES = ['light', 'dark'] as const;

const TEXT_TOKENS = ['textPrimary', 'textSecondary', 'textTertiary'] as const;

const BACKGROUND_TOKENS = [
  'backgroundPrimary',
  'backgroundSecondary',
  'backgroundTertiary',
  'surfaceSecondary',
  'surfaceElevated',
] as const;

const PAIRS = THEMES.flatMap((theme) =>
  TEXT_TOKENS.flatMap((text) =>
    BACKGROUND_TOKENS.map((background) => ({ background, text, theme })),
  ),
);

const THEME_COLORS = THEMES.flatMap((theme) =>
  readThemeColors(theme).map((color) => ({ ...color, theme })),
);

describe('theme text contrast', () => {
  it.each(PAIRS)(
    '$theme $text on $background meets WCAG AA for body text',
    ({ background, text, theme }) => {
      expect(
        getThemeTokenContrast({
          background: colors[background],
          foreground: colors[text],
          theme,
        }),
      ).toBeGreaterThanOrEqual(WCAG_AA_BODY_TEXT);
    },
  );
});

describe('theme colour gamut', () => {
  it.each(THEME_COLORS)(
    '$theme $name ($value) is inside the sRGB gamut',
    ({ value }) => {
      expect(isInSrgbGamut(value)).toBe(true);
    },
  );

  it('covers the tokens that left the gamut before', () => {
    const covered = THEME_COLORS.map(({ name, theme }) => `${theme} ${name}`);

    expect(covered).toEqual(
      expect.arrayContaining([
        'light textTertiary',
        'dark textTertiary',
        'dark brandPrimaryCardText',
      ]),
    );
  });
});
