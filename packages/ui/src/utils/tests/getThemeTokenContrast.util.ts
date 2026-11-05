/**
 * Computes the WCAG contrast ratio between two colour tokens as a theme assigns them.
 * The background is composited over an opaque surface and the foreground over that result, in sRGB, the way a browser paints them.
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

  const backdrop = compositeOverSurface({
    color: readToken(background),
    surface: base.rgb,
  });
  const painted = compositeOverSurface({
    color: readToken(foreground),
    surface: backdrop,
  });
  const [lighter = 0, darker = 0] = [
    getLuminance(painted),
    getLuminance(backdrop),
  ].toSorted((left, right) => right - left);

  return (lighter + 0.05) / (darker + 0.05);
};
