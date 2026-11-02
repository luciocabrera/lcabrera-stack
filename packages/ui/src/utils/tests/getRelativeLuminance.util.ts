import { gammaDecodeSrgb } from './gammaDecodeSrgb.util';

export const getRelativeLuminance = ([red, green, blue]: readonly [
  number,
  number,
  number,
]) =>
  0.2126 * gammaDecodeSrgb(red) +
  0.7152 * gammaDecodeSrgb(green) +
  0.0722 * gammaDecodeSrgb(blue);
