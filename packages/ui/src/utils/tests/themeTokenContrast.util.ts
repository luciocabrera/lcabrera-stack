/**
 * Computes the WCAG contrast ratio between two colour tokens as a theme assigns them.
 * StyleX compiles the assigned values out of the runtime, so they are read from the theme sources.
 * A translucent colour is composited over an opaque surface in sRGB, the way a browser paints it.
 */

import { colors } from '#ui/design-system/tokens/colors.stylex';

export type ThemeName = 'dark' | 'light';

type MultiplyArgs = {
  readonly matrix: readonly (readonly number[])[];
  readonly vector: Rgb;
};

type ReadNumberArgs = {
  readonly channel: string;
  readonly value: string;
};

type ReadThemeValueArgs = {
  readonly name: string;
  readonly theme: ThemeName;
};

type ResolveTokenArgs = {
  readonly surface: Rgb;
  readonly theme: ThemeName;
  readonly token: string;
};

type Rgb = readonly [number, number, number];

type Rgba = {
  readonly alpha: number;
  readonly rgb: Rgb;
};

type ThemeTokenContrastArgs = {
  readonly background: string;
  readonly foreground: string;
  readonly surface?: string;
  readonly theme: ThemeName;
};

const THEME_SOURCES = import.meta.glob<string>(
  [
    '../../design-system/themes/dark.stylex.ts',
    '../../design-system/themes/light.stylex.ts',
  ],
  { eager: true, import: 'default', query: '?raw' },
);

const OKLAB_TO_LMS = [
  [0.3963377774, 0.2158037573],
  [-0.1055613458, -0.0638541728],
  [-0.0894841775, -1.291485548],
] as const;

const LMS_TO_LINEAR_SRGB = [
  [4.0767416621, -3.3077115913, 0.2309699292],
  [-1.2684380046, 2.6097574011, -0.3413193965],
  [-0.0041960863, -0.7034186147, 1.707614701],
] as const;

const XYZ_D50_TO_LINEAR_SRGB = [
  [3.134135957, -1.6173863322, -0.490661946],
  [-0.9787955029, 1.9162545673, 0.0334427312],
  [0.0719553799, -0.2289768264, 1.4053860583],
] as const;

const D50_WHITE = [0.96422, 1, 0.82521] as const;

const LAB_EPSILON = 216 / 24_389;

const LAB_KAPPA = 24_389 / 27;

const LUMINANCE_WEIGHTS = [0.2126, 0.7152, 0.0722] as const;

const multiply = ({ matrix, vector }: MultiplyArgs) =>
  matrix.map((row) =>
    row.reduce((sum, weight, index) => sum + weight * (vector[index] ?? 0), 0),
  );

const toTriple = ([first = 0, second = 0, third = 0]: readonly number[]) =>
  [first, second, third] as const;

const encode = (linear: number) => {
  const clamped = Math.min(1, Math.max(0, linear));

  return clamped <= 0.0031308
    ? clamped * 12.92
    : 1.055 * clamped ** (1 / 2.4) - 0.055;
};

const decode = (encoded: number) =>
  encoded <= 0.04045 ? encoded / 12.92 : ((encoded + 0.055) / 1.055) ** 2.4;

export const getColorTokenName = (tokenValue: string) => {
  const name = Object.entries(colors).find(
    ([, value]) => value === tokenValue,
  )?.[0];

  if (name === undefined) {
    throw new Error(`${tokenValue} is not a colour token`);
  }

  return name;
};

export const readThemeValue = ({ name, theme }: ReadThemeValueArgs) => {
  const prefix = `${name}: '`;
  const line = (
    THEME_SOURCES[`../../design-system/themes/${theme}.stylex.ts`] ?? ''
  )
    .split('\n')
    .map((sourceLine) => sourceLine.trim())
    .find((sourceLine) => sourceLine.startsWith(prefix));

  if (line === undefined) {
    throw new Error(`The ${theme} theme assigns no value to ${name}`);
  }

  return line.slice(prefix.length, line.indexOf("'", prefix.length));
};

const readNumber = ({ channel, value }: ReadNumberArgs) => {
  const number = Number(channel.replace(/%$/u, ''));

  if (!Number.isFinite(number)) {
    throw new TypeError(`Cannot read the channels of ${value}`);
  }

  return { isPercent: channel.endsWith('%'), number };
};

const readChannels = (value: string) => {
  const [colour = '', alpha, ...rest] = value
    .slice(value.indexOf('(') + 1, -1)
    .split('/');
  const channels = colour.split(' ').filter(Boolean);

  if (channels.length !== 3 || rest.length > 0) {
    throw new TypeError(`Cannot read the channels of ${value}`);
  }

  const opacity =
    alpha === undefined
      ? { isPercent: false, number: 1 }
      : readNumber({ channel: alpha.trim(), value });

  return {
    alpha: opacity.isPercent ? opacity.number / 100 : opacity.number,
    channels: channels.map((channel) => readNumber({ channel, value })),
  };
};

const oklchToLinearSrgb = (value: string) => {
  const { alpha, channels } = readChannels(value);
  const [lightness, chroma, hue] = channels;
  const l = lightness?.isPercent
    ? lightness.number / 100
    : (lightness?.number ?? 0);
  const radians = ((hue?.number ?? 0) * Math.PI) / 180;
  const a = (chroma?.number ?? 0) * Math.cos(radians);
  const b = (chroma?.number ?? 0) * Math.sin(radians);
  const lms = toTriple(
    OKLAB_TO_LMS.map(([fromA, fromB]) => (l + fromA * a + fromB * b) ** 3),
  );

  return {
    alpha,
    rgb: toTriple(multiply({ matrix: LMS_TO_LINEAR_SRGB, vector: lms })),
  };
};

const labToLinearSrgb = (value: string) => {
  const { alpha, channels } = readChannels(value);
  const [lightness, greenRed, blueYellow] = channels;
  const l = lightness?.number ?? 0;
  const fy = (l + 16) / 116;
  const fx = fy + (greenRed?.number ?? 0) / 500;
  const fz = fy - (blueYellow?.number ?? 0) / 200;
  const inverse = (f: number) =>
    f ** 3 > LAB_EPSILON ? f ** 3 : (116 * f - 16) / LAB_KAPPA;
  const xyz = toTriple([
    inverse(fx) * D50_WHITE[0],
    (l > LAB_KAPPA * LAB_EPSILON ? fy ** 3 : l / LAB_KAPPA) * D50_WHITE[1],
    inverse(fz) * D50_WHITE[2],
  ]);

  return {
    alpha,
    rgb: toTriple(multiply({ matrix: XYZ_D50_TO_LINEAR_SRGB, vector: xyz })),
  };
};

export const readColor = (value: string): Rgba => {
  const linear = (() => {
    if (value.startsWith('oklch(')) return oklchToLinearSrgb(value);
    if (value.startsWith('lab(')) return labToLinearSrgb(value);

    throw new Error(`Unsupported colour value ${value}`);
  })();

  return {
    alpha: linear.alpha,
    rgb: toTriple(linear.rgb.map((channel) => encode(channel))),
  };
};

export const getLuminance = (rgb: Rgb) =>
  rgb
    .map((channel) => decode(channel))
    .reduce(
      (sum, channel, index) => sum + channel * (LUMINANCE_WEIGHTS[index] ?? 0),
      0,
    );

const resolveToken = ({ surface, theme, token }: ResolveTokenArgs) => {
  const { alpha, rgb } = readColor(
    readThemeValue({ name: getColorTokenName(token), theme }),
  );

  return toTriple(
    rgb.map(
      (channel, index) => alpha * channel + (1 - alpha) * (surface[index] ?? 0),
    ),
  );
};

export const getThemeTokenContrast = ({
  background,
  foreground,
  surface = colors.backgroundPrimary,
  theme,
}: ThemeTokenContrastArgs) => {
  const base = readColor(
    readThemeValue({ name: getColorTokenName(surface), theme }),
  );

  if (base.alpha !== 1) {
    throw new Error(`The ${theme} theme's surface ${surface} is translucent`);
  }

  const [lighter = 0, darker = 0] = [foreground, background]
    .map((token) =>
      getLuminance(resolveToken({ surface: base.rgb, theme, token })),
    )
    .toSorted((left, right) => right - left);

  return (lighter + 0.05) / (darker + 0.05);
};
