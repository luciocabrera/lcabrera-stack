import type { Rgba } from './tests.types';

import { encodeSrgbChannel } from './encodeSrgbChannel.util';
import { readLinearColor } from './readLinearColor.util';

export const readColor = (value: string): Rgba => {
  const { alpha, rgb } = readLinearColor(value);
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
