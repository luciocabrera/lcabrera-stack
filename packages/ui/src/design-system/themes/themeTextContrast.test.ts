import { describe, expect, it } from 'vite-plus/test';

import { getContrastRatio } from '#ui/utils/tests/getContrastRatio.util';
import { readThemeTokenValue } from '#ui/utils/tests/readThemeTokenValue.util';

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
      const ratio = getContrastRatio({
        background: readThemeTokenValue({ theme, token: background }),
        foreground: readThemeTokenValue({ theme, token: text }),
      });

      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_BODY_TEXT);
    },
  );
});
