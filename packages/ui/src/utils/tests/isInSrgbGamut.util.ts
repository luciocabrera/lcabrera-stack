/**
 * Whether an `oklch()` or `lab()` value lies inside the sRGB gamut before any clipping.
 * The tolerance absorbs the rounding in the published conversion matrices, which put `lab(100 0 0)` a hair above 1 in linear light.
 */

import { readLinearColor } from './readLinearColor.util';

const CONVERSION_TOLERANCE = 0.0002;

export const isInSrgbGamut = (value: string) =>
  readLinearColor(value).rgb.every(
    (channel) =>
      channel >= -CONVERSION_TOLERANCE && channel <= 1 + CONVERSION_TOLERANCE,
  );
