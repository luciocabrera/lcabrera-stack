/**
 * Computes the WCAG contrast ratio between two colour tokens as a theme assigns them.
 * StyleX compiles the assigned values out of the runtime, so they are read from the theme sources.
 */

import { colors } from '#ui/design-system/tokens/colors.stylex';

export type ThemeName = 'dark' | 'light';

type ColorChannel = {
  readonly isPercent: boolean;
  readonly number: number;
};

type ReadChannelsArgs = {
  readonly functionName: string;
  readonly value: string;
};

type ReadThemeValueArgs = {
  readonly name: string;
  readonly theme: ThemeName;
};

type ThemeTokenContrastArgs = {
  readonly background: string;
  readonly foreground: string;
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

const LMS_TO_LUMINANCE = [-0.0405801784, 1.1122568696, -0.0716766787] as const;

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

const readChannels = ({ functionName, value }: ReadChannelsArgs) => {
  const channels = value
    .slice(functionName.length + 1, -1)
    .split(' ')
    .filter(Boolean)
    .map((channel): ColorChannel => ({
      isPercent: channel.endsWith('%'),
      number: Number(channel.replace(/%$/u, '')),
    }));

  const [first, second, third] = channels;

  if (
    first === undefined ||
    second === undefined ||
    third === undefined ||
    channels.length !== 3 ||
    channels.some((channel) => !Number.isFinite(channel.number))
  ) {
    throw new Error(`Cannot read the channels of ${value}`);
  }

  return [first, second, third] as const;
};

const getOklchLuminance = (value: string) => {
  const [lightness, chroma, hue] = readChannels({
    functionName: 'oklch',
    value,
  });
  const l = lightness.isPercent ? lightness.number / 100 : lightness.number;
  const radians = (hue.number * Math.PI) / 180;
  const a = chroma.number * Math.cos(radians);
  const b = chroma.number * Math.sin(radians);

  return OKLAB_TO_LMS.map(
    ([fromA, fromB]) => (l + fromA * a + fromB * b) ** 3,
  ).reduce(
    (luminance, cone, index) =>
      luminance + cone * (LMS_TO_LUMINANCE[index] ?? 0),
    0,
  );
};

const getLabLuminance = (value: string) => {
  const [{ number: lightness }] = readChannels({ functionName: 'lab', value });

  return lightness > 8 ? ((lightness + 16) / 116) ** 3 : lightness / 903.3;
};

export const getLuminance = (value: string) => {
  if (value.startsWith('oklch(')) return getOklchLuminance(value);
  if (value.startsWith('lab(')) return getLabLuminance(value);

  throw new Error(`Unsupported colour value ${value}`);
};

export const getThemeTokenContrast = ({
  background,
  foreground,
  theme,
}: ThemeTokenContrastArgs) => {
  const [lighter = 0, darker = 0] = [foreground, background]
    .map((token) =>
      getLuminance(readThemeValue({ name: getColorTokenName(token), theme })),
    )
    .toSorted((left, right) => right - left);

  return (lighter + 0.05) / (darker + 0.05);
};
