/**
 * Reads a theme's source as trimmed lines.
 * StyleX compiles theme values out of the runtime, so the source text is the only place a test can read them.
 */

import type { ThemeName } from './tests.types';

const THEME_SOURCES = import.meta.glob<string>(
  [
    '../../design-system/themes/dark.stylex.ts',
    '../../design-system/themes/light.stylex.ts',
  ],
  { eager: true, import: 'default', query: '?raw' },
);

export const readThemeSourceLines = (theme: ThemeName) =>
  (THEME_SOURCES[`../../design-system/themes/${theme}.stylex.ts`] ?? '')
    .split('\n')
    .map((sourceLine) => sourceLine.trim());
