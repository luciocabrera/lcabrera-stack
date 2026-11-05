import type { Rgb } from './tests.types';

import { decodeSrgbChannel } from './decodeSrgbChannel.util';

export const getLuminance = ([red, green, blue]: Rgb) =>
  0.2126 * decodeSrgbChannel(red) +
  0.7152 * decodeSrgbChannel(green) +
  0.0722 * decodeSrgbChannel(blue);
