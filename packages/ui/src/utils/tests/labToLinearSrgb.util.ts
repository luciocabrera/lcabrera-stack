import type { ColorMatrix } from './tests.types';

import { multiplyColorMatrix } from './multiplyColorMatrix.util';
import { readColorChannels } from './readColorChannels.util';

const XYZ_D50_TO_LINEAR_SRGB: ColorMatrix = [
  [3.134135957, -1.6173863322, -0.490661946],
  [-0.9787955029, 1.9162545673, 0.0334427312],
  [0.0719553799, -0.2289768264, 1.4053860583],
];

const D50_WHITE = [0.96422, 1, 0.82521] as const;

const LAB_EPSILON = 216 / 24_389;

const LAB_KAPPA = 24_389 / 27;

export const labToLinearSrgb = (value: string) => {
  const { alpha, channels } = readColorChannels(value);
  const [{ number: lightness }, { number: greenRed }, { number: blueYellow }] =
    channels;
  const fy = (lightness + 16) / 116;
  const fromCubeRoot = (f: number) =>
    f ** 3 > LAB_EPSILON ? f ** 3 : (116 * f - 16) / LAB_KAPPA;
  const y =
    lightness > LAB_KAPPA * LAB_EPSILON ? fy ** 3 : lightness / LAB_KAPPA;

  return {
    alpha,
    rgb: multiplyColorMatrix({
      matrix: XYZ_D50_TO_LINEAR_SRGB,
      vector: [
        fromCubeRoot(fy + greenRed / 500) * D50_WHITE[0],
        y * D50_WHITE[1],
        fromCubeRoot(fy - blueYellow / 200) * D50_WHITE[2],
      ],
    }),
  };
};
