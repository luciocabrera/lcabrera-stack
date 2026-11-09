/**
 * Compiles one StyleX module from the source an `import.meta.glob` read and measures the text colour each listed style sets, in both themes, against the background it sets or against each background named.
 * A style that sets no text colour, that sets no background where none is named, or that sets one where some are named, is refused rather than measured against a guess.
 */

import type { StyleXStyles } from '@stylexjs/stylex';

import * as stylex from '@stylexjs/stylex';

import { compileStylexRules } from './compileStylexRules.util';
import { getColorTokenName } from './getColorTokenName.util';
import { getThemeTokenContrast } from './getThemeTokenContrast.util';
import { readStylexDeclaration } from './readStylexDeclaration.util';

type ListStyleTextContrastsArgs = {
  readonly backgrounds?: readonly string[];
  readonly path: string;
  readonly sources: Readonly<Record<string, string>>;
  readonly styles: Readonly<Record<string, StyleXStyles>>;
};

const THEMES = ['light', 'dark'] as const;

export const listStyleTextContrasts = async ({
  backgrounds,
  path,
  sources,
  styles,
}: ListStyleTextContrastsArgs) => {
  const [source, ...others] = Object.values(sources);

  if (source === undefined || others.length > 0) {
    throw new Error(`Expected the source of ${path} alone`);
  }

  const rules = await compileStylexRules([{ path, source }]);

  return Object.entries(styles).flatMap(([name, style]) => {
    const className = stylex.props(style).className;
    const read = (property: string) =>
      readStylexDeclaration({ className, property, rules });
    const foreground = read('color');

    if (foreground === undefined) {
      throw new Error(`${name} sets no text colour`);
    }

    const ownBackground = read('background-color');

    if (ownBackground !== undefined && backgrounds !== undefined) {
      throw new Error(`${name} sets its own background, so none can be named`);
    }

    const drawnOn =
      backgrounds ?? (ownBackground === undefined ? [] : [ownBackground]);

    if (drawnOn.length === 0) {
      throw new Error(`${name} sets no background and none is named`);
    }

    return THEMES.flatMap((theme) =>
      drawnOn.map((background) => ({
        background: getColorTokenName(background),
        foreground: getColorTokenName(foreground),
        name,
        ratio: getThemeTokenContrast({ background, foreground, theme }),
        theme,
      })),
    );
  });
};
