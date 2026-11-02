import type { Rgba } from './tests.types';

import { encodeSrgbChannel } from './encodeSrgbChannel.util';
import { labToLinearSrgb } from './labToLinearSrgb.util';
import { oklchToLinearSrgb } from './oklchToLinearSrgb.util';

export const readColor = (value: string): Rgba => {
  const toLinear = () => {
    if (value.startsWith('oklch(')) return oklchToLinearSrgb(value);
    if (value.startsWith('lab(')) return labToLinearSrgb(value);

    throw new Error(`Unsupported colour value ${value}`);
  };
  const { alpha, rgb } = toLinear();
  const [red, green, blue] = rgb;

  return {
    alpha,
    rgb: [
      encodeSrgbChannel(red),
      encodeSrgbChannel(green),
      encodeSrgbChannel(blue),
    ],
  };
};
