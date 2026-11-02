/**
 * Computes the WCAG 2 contrast ratio of a CSS colour drawn over an opaque one.
 * A translucent foreground is composited over the background in gamma-encoded sRGB, which is how a browser paints it.
 */

import { gammaEncodeSrgb } from './gammaEncodeSrgb.util';
import { getRelativeLuminance } from './getRelativeLuminance.util';
import { toLinearSrgb } from './toLinearSrgb.util';

type GetContrastRatioArgs = {
  readonly background: string;
  readonly foreground: string;
};

export const getContrastRatio = ({
  background,
  foreground,
}: GetContrastRatioArgs) => {
  const base = toLinearSrgb(background);

  if (base.alpha !== 1) {
    throw new Error(`The background ${background} is translucent`);
  }

  const top = toLinearSrgb(foreground);
  const surface = [
    gammaEncodeSrgb(base.rgb[0]),
    gammaEncodeSrgb(base.rgb[1]),
    gammaEncodeSrgb(base.rgb[2]),
  ] as const;
  const paint = (index: 0 | 1 | 2) =>
    gammaEncodeSrgb(top.rgb[index]) * top.alpha +
    surface[index] * (1 - top.alpha);
  const [lighter = 0, darker = 0] = [
    getRelativeLuminance([paint(0), paint(1), paint(2)]),
    getRelativeLuminance(surface),
  ].toSorted((left, right) => right - left);

  return (lighter + 0.05) / (darker + 0.05);
};
