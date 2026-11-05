import type { ThemeName } from './tests.types';

import { readThemeSourceLines } from './readThemeSourceLines.util';

type ReadThemeValueArgs = {
  readonly name: string;
  readonly theme: ThemeName;
};

export const readThemeValue = ({ name, theme }: ReadThemeValueArgs) => {
  const prefix = `${name}: '`;
  const line = readThemeSourceLines(theme).find((sourceLine) =>
    sourceLine.startsWith(prefix),
  );

  if (line === undefined) {
    throw new Error(`The ${theme} theme assigns no value to ${name}`);
  }

  return line.slice(prefix.length, line.indexOf("'", prefix.length));
};
