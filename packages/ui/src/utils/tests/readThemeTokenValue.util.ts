/**
 * Reads the literal value a theme module assigns a colour token.
 * StyleX compiles a theme's values out of the runtime object, so the module source is the only place a test can read them.
 */

type ReadThemeTokenValueArgs = {
  readonly theme: 'dark' | 'light';
  readonly token: string;
};

const THEME_SOURCES = {
  dark: import.meta.glob<string>('../../design-system/themes/dark.stylex.ts', {
    eager: true,
    import: 'default',
    query: '?raw',
  }),
  light: import.meta.glob<string>(
    '../../design-system/themes/light.stylex.ts',
    { eager: true, import: 'default', query: '?raw' },
  ),
} as const;

const TOKEN_ASSIGNMENT = /^\s*(\w+):\s*'([^']*)'/gmu;

export const readThemeTokenValue = ({
  theme,
  token,
}: ReadThemeTokenValueArgs) => {
  const [source = ''] = Object.values(THEME_SOURCES[theme]);
  const value = source
    .matchAll(TOKEN_ASSIGNMENT)
    .find(([, name]) => name === token)?.[2];

  if (value === undefined) {
    throw new Error(`The ${theme} theme assigns no value to ${token}`);
  }

  return value;
};
