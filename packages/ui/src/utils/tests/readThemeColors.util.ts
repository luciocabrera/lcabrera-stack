/**
 * Lists the literal `oklch()` and `lab()` colours a theme assigns, by token name.
 * A relative `oklch(from …)` value names no channels to read, and a hex value cannot leave the sRGB gamut, so neither is listed.
 */

import type { ThemeName } from './tests.types';

import { readThemeSourceLines } from './readThemeSourceLines.util';
import { readThemeValue } from './readThemeValue.util';

const LITERAL_COLOR = /^\w+: '(?:lab|oklch)\((?!from )/u;

export const readThemeColors = (theme: ThemeName) =>
  readThemeSourceLines(theme)
    .filter((sourceLine) => LITERAL_COLOR.test(sourceLine))
    .map((sourceLine) => {
      const name = sourceLine.slice(0, sourceLine.indexOf(':'));

      return { name, value: readThemeValue({ name, theme }) };
    });
