import type { ColorMatrix } from './tests.types';

import { multiplyColorMatrix } from './multiplyColorMatrix.util';
import { readColorChannels } from './readColorChannels.util';

const OKLAB_TO_LMS: ColorMatrix = [
  [1, 0.3963377774, 0.2158037573],
  [1, -0.1055613458, -0.0638541728],
  [1, -0.0894841775, -1.291485548],
];

const LMS_TO_LINEAR_SRGB: ColorMatrix = [
  [4.0767416621, -3.3077115913, 0.2309699292],
  [-1.2684380046, 2.6097574011, -0.3413193965],
  [-0.0041960863, -0.7034186147, 1.707614701],
];

export const oklchToLinearSrgb = (value: string) => {
  const { alpha, channels } = readColorChannels(value);
  const [lightness, chroma, hue] = channels;
  const l = lightness.isPercent ? lightness.number / 100 : lightness.number;
  const radians = (hue.number * Math.PI) / 180;
  const [long, medium, short] = multiplyColorMatrix({
    matrix: OKLAB_TO_LMS,
    vector: [
      l,
      chroma.number * Math.cos(radians),
      chroma.number * Math.sin(radians),
    ],
  });

  return {
    alpha,
    rgb: multiplyColorMatrix({
      matrix: LMS_TO_LINEAR_SRGB,
      vector: [long ** 3, medium ** 3, short ** 3],
    }),
  };
};
