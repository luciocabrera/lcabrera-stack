/**
 * Compiles one StyleX module from the raw source a lazy, root-relative `import.meta.glob` loads, and measures the text colour each listed style sets, in both themes. A style that sets its own background is measured on it over every surface in `PAGE_BACKGROUNDS`; one that does not is measured directly on each background named.
 * A style that sets no text colour, that sets no background where none is named, or that sets one where some are named, is refused rather than measured against a guess.
 */

import type { StyleXStyles } from '@stylexjs/stylex';

import * as stylex from '@stylexjs/stylex';

import { colors } from '#ui/design-system/tokens/colors.stylex';

import { compileStylexRules } from './compileStylexRules.util';
import { getColorTokenName } from './getColorTokenName.util';
import { getThemeTokenContrast } from './getThemeTokenContrast.util';
import { readStylexDeclaration } from './readStylexDeclaration.util';
import { PAGE_BACKGROUNDS } from './tests.constants';

type ListStyleTextContrastsArgs = {
  readonly backgrounds?: readonly string[];
  readonly sources: Readonly<Record<string, () => Promise<unknown>>>;
  readonly styles: Readonly<Record<string, StyleXStyles>>;
};

const THEMES = ['light', 'dark'] as const;

export const listStyleTextContrasts = async ({
  backgrounds,
  sources,
  styles,
}: ListStyleTextContrastsArgs) => {
  const [module, ...others] = Object.entries(sources);

  if (module === undefined || others.length > 0) {
    throw new Error('Expected the source of one StyleX module');
  }

  const [key, load] = module;
  const loaded = await load();
  const source =
    typeof loaded === 'object' && loaded !== null && 'default' in loaded
      ? loaded.default
      : undefined;

  if (typeof source !== 'string') {
    throw new TypeError(`${key} was not read as raw source`);
  }

  const rules = await compileStylexRules([
    { path: key.replace(/^\/src\//u, ''), source },
  ]);

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

    const layers =
      ownBackground === undefined
        ? (backgrounds ?? []).map((background) => ({
            background,
            surface: colors.backgroundPrimary,
          }))
        : PAGE_BACKGROUNDS.map((surface) => ({
            background: ownBackground,
            surface,
          }));

    if (layers.length === 0) {
      throw new Error(`${name} sets no background and none is named`);
    }

    return THEMES.flatMap((theme) =>
      layers.map(({ background, surface }) => ({
        background: getColorTokenName(background),
        foreground: getColorTokenName(foreground),
        name,
        ratio: getThemeTokenContrast({
          background,
          foreground,
          surface,
          theme,
        }),
        surface: getColorTokenName(surface),
        theme,
      })),
    );
  });
};
