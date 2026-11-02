/**
 * Converts a CSS `lab()` or `oklch()` colour to linear-light sRGB channels and its alpha.
 * A colour outside sRGB throws: a browser gamut-maps it, so a clipped channel would report a contrast nothing paints.
 */

import { applyColorMatrix } from './applyColorMatrix.util';
import { readCssNumber } from './readCssNumber.util';
import {
  D50_WHITE,
  D50_XYZ_TO_D65_XYZ,
  D65_XYZ_TO_LINEAR_SRGB,
  LAB_EPSILON,
  LAB_KAPPA,
  LMS_TO_LINEAR_SRGB,
  OKLAB_TO_LMS,
  SRGB_GAMUT_TOLERANCE,
} from './tests.constants';

const COLOR_PATTERN = /^(lab|oklch)\((.*)\)$/u;

export const toLinearSrgb = (value: string) => {
  const match = COLOR_PATTERN.exec(value.trim());

  if (match === null) {
    throw new Error(`Unsupported colour value ${value}`);
  }

  const [, space, body = ''] = match;
  const [channelText = '', alphaText] = body.split('/', 2);
  const [first = '', second = '', third = ''] = channelText
    .trim()
    .split(/\s+/u, 3);

  const fromLab = () => {
    const lightness = readCssNumber({ percentScale: 100, text: first });
    const fy = (lightness + 16) / 116;
    const fx = fy + readCssNumber({ percentScale: 125, text: second }) / 500;
    const fz = fy - readCssNumber({ percentScale: 125, text: third }) / 200;
    const xr = fx ** 3 > LAB_EPSILON ? fx ** 3 : (116 * fx - 16) / LAB_KAPPA;
    const yr =
      lightness > LAB_KAPPA * LAB_EPSILON ? fy ** 3 : lightness / LAB_KAPPA;
    const zr = fz ** 3 > LAB_EPSILON ? fz ** 3 : (116 * fz - 16) / LAB_KAPPA;
    const [x = 0, y = 0, z = 0] = applyColorMatrix({
      matrix: D50_XYZ_TO_D65_XYZ,
      vector: [xr * D50_WHITE[0], yr * D50_WHITE[1], zr * D50_WHITE[2]],
    });

    return applyColorMatrix({
      matrix: D65_XYZ_TO_LINEAR_SRGB,
      vector: [x, y, z],
    });
  };

  const fromOklch = () => {
    const lightness = readCssNumber({ percentScale: 1, text: first });
    const chroma = readCssNumber({ percentScale: 0.4, text: second });
    const hue =
      (readCssNumber({ percentScale: 1, text: third }) * Math.PI) / 180;
    const [l = 0, m = 0, s = 0] = applyColorMatrix({
      matrix: OKLAB_TO_LMS,
      vector: [lightness, chroma * Math.cos(hue), chroma * Math.sin(hue)],
    });

    return applyColorMatrix({
      matrix: LMS_TO_LINEAR_SRGB,
      vector: [l ** 3, m ** 3, s ** 3],
    });
  };

  const [red = 0, green = 0, blue = 0] =
    space === 'lab' ? fromLab() : fromOklch();
  if (
    [red, green, blue].some(
      (channel) =>
        channel < -SRGB_GAMUT_TOLERANCE || channel > 1 + SRGB_GAMUT_TOLERANCE,
    )
  ) {
    throw new Error(`${value} lies outside the sRGB gamut`);
  }

  return {
    alpha:
      alphaText === undefined
        ? 1
        : readCssNumber({ percentScale: 1, text: alphaText.trim() }),
    rgb: [
      Math.min(1, Math.max(0, red)),
      Math.min(1, Math.max(0, green)),
      Math.min(1, Math.max(0, blue)),
    ] as const,
  };
};
