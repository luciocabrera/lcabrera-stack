/**
 * Measures the text colour each compiled StyleX style sets, in both themes, against the background it sets or against each background named.
 * A style that sets no text colour, or no background where none is named, is refused rather than measured against a default.
 */

import type { StyleXStyles } from '@stylexjs/stylex';

import * as stylex from '@stylexjs/stylex';

import type { CompiledStylexRule } from './tests.types';

import { getColorTokenName } from './getColorTokenName.util';
import { getThemeTokenContrast } from './getThemeTokenContrast.util';
import { readStylexDeclaration } from './readStylexDeclaration.util';

type ListStyleTextContrastsArgs = {
  readonly backgrounds?: readonly string[];
  readonly rules: readonly CompiledStylexRule[];
  readonly styles: Readonly<Record<string, StyleXStyles>>;
};

const THEMES = ['light', 'dark'] as const;

export const listStyleTextContrasts = ({
  backgrounds,
  rules,
  styles,
}: ListStyleTextContrastsArgs) =>
  Object.entries(styles).flatMap(([name, style]) => {
    const className = stylex.props(style).className;
    const read = (property: string) =>
      readStylexDeclaration({ className, property, rules });
    const foreground = read('color');
    const ownBackground = read('background-color');
    const drawnOn =
      backgrounds ?? (ownBackground === undefined ? [] : [ownBackground]);

    if (foreground === undefined || drawnOn.length === 0) {
      throw new Error(`${name} sets no text colour or no background`);
    }

    return THEMES.flatMap((theme) =>
      drawnOn.map((background) => ({
        background: getColorTokenName(background),
        name,
        ratio: getThemeTokenContrast({ background, foreground, theme }),
        theme,
      })),
    );
  });
