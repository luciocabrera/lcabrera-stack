/**
 * Reads the literal value a theme source assigns a colour token.
 * StyleX compiles theme values out of the runtime, so the source text is the only place a test can read them.
 */

import type { ThemeName } from './tests.types';

type ReadThemeValueArgs = {
  readonly name: string;
  readonly theme: ThemeName;
};

const THEME_SOURCES = import.meta.glob<string>(
  [
    '../../design-system/themes/dark.stylex.ts',
    '../../design-system/themes/light.stylex.ts',
  ],
  { eager: true, import: 'default', query: '?raw' },
);

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
