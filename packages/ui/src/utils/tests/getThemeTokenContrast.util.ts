/**
 * Computes the WCAG contrast ratio between two colour tokens as a theme assigns them.
 * A translucent token is composited over an opaque surface in sRGB, the way a browser paints it.
 */

import { colors } from '#ui/design-system/tokens/colors.stylex';

import type { ThemeName } from './tests.types';

import { compositeOverSurface } from './compositeOverSurface.util';
import { getColorTokenName } from './getColorTokenName.util';
import { getLuminance } from './getLuminance.util';
import { readColor } from './readColor.util';
import { readThemeValue } from './readThemeValue.util';

type ThemeTokenContrastArgs = {
  readonly background: string;
  readonly foreground: string;
  readonly surface?: string;
  readonly theme: ThemeName;
};

export const getThemeTokenContrast = ({
  background,
  foreground,
  surface = colors.backgroundPrimary,
  theme,
}: ThemeTokenContrastArgs) => {
  const readToken = (token: string) =>
    readColor(readThemeValue({ name: getColorTokenName(token), theme }));
  const base = readToken(surface);

  if (base.alpha !== 1) {
    throw new Error(`The ${theme} theme's surface ${surface} is translucent`);
  }

  const [lighter = 0, darker = 0] = [foreground, background]
    .map((token) =>
      getLuminance(
        compositeOverSurface({ color: readToken(token), surface: base.rgb }),
      ),
    )
    .toSorted((left, right) => right - left);

  return (lighter + 0.05) / (darker + 0.05);
};
