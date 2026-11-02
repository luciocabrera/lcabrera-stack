import { describe, expect, it } from 'vite-plus/test';

import { colors } from '#ui/design-system/tokens/colors.stylex';
import { getThemeTokenContrast } from '#ui/utils/tests/getThemeTokenContrast.util';

const WCAG_AA_BODY_TEXT = 4.5;

const THEMES = ['light', 'dark'] as const;

const TEXT_TOKENS = ['textPrimary', 'textSecondary'] as const;

const BACKGROUND_TOKENS = [
  'backgroundPrimary',
  'backgroundSecondary',
  'backgroundTertiary',
] as const;

const PAIRS = THEMES.flatMap((theme) =>
  TEXT_TOKENS.flatMap((text) =>
    BACKGROUND_TOKENS.map((background) => ({ background, text, theme })),
  ),
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
