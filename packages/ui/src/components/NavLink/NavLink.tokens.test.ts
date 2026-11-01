import * as stylex from '@stylexjs/stylex';
import { describe, expect, it } from 'vite-plus/test';

import type { ThemeName } from '#ui/utils/tests/themeTokenContrast.util';

import { colors } from '#ui/design-system/tokens/colors.stylex';
import {
  compileStylexRules,
  readStylexDeclaration,
} from '#ui/utils/tests/compileStylexRules.util';
import {
  getColorTokenName,
  getThemeTokenContrast,
} from '#ui/utils/tests/themeTokenContrast.util';

import { linkItemStyles } from './NavLink.stylex';
import { getInlineClassName } from './utils';

const SOURCES = import.meta.glob<string>('./NavLink.stylex.ts', {
  eager: true,
  import: 'default',
  query: '?raw',
});

const rules = await compileStylexRules([
  {
    path: 'components/NavLink/NavLink.stylex.ts',
    source: SOURCES['./NavLink.stylex.ts'] ?? '',
  },
]);

const THEMES: readonly ThemeName[] = ['light', 'dark'];

const BACKGROUNDS = [
  colors.backgroundPrimary,
  colors.backgroundSecondary,
  colors.backgroundTertiary,
];

const inlineClassName = getInlineClassName({
  isActive: false,
  isPending: false,
  styles: linkItemStyles,
});

const appliedText =
  readStylexDeclaration({
    className: inlineClassName,
    property: 'color',
    rules,
  }) ?? '';

const appliedFocus = (
  readStylexDeclaration({
    className: inlineClassName,
    property: 'outline',
    pseudo: ':focus-visible',
    rules,
  }) ?? ''
).replace('2px solid ', '');

describe('the inline NavLink colour tokens', () => {
  it('compiles the NavLink style module', () => {
    expect(rules.length).toBeGreaterThan(0);
  });

  it('reads the declarations behind the classes the inline link renders', () => {
    expect(inlineClassName).toBe(
      stylex.props(linkItemStyles.inline.link).className,
    );
    expect(
      readStylexDeclaration({
        className: inlineClassName,
        property: 'outline',
        rules,
      }),
    ).toBe('none');
    expect(
      readStylexDeclaration({
        className: inlineClassName,
        property: 'text-decoration-line',
        pseudo: ':hover',
        rules,
      }),
    ).toBe('underline');
    expect(
      readStylexDeclaration({
        className: inlineClassName,
        property: 'text-decoration-line',
        pseudo: ':focus-visible',
        rules,
      }),
    ).toBe('underline');
  });

  it('draws its text and focus ring from the brand card text token', () => {
    expect(getColorTokenName(appliedText)).toBe('brandPrimaryCardText');
    expect(getColorTokenName(appliedFocus)).toBe('brandPrimaryCardText');
  });

  it.each(THEMES)(
    'keeps the text at 4.5:1 and the focus ring at 3:1 on every %s background',
    (theme) => {
      for (const background of BACKGROUNDS) {
        expect(
          getThemeTokenContrast({ background, foreground: appliedText, theme }),
        ).toBeGreaterThanOrEqual(4.5);
        expect(
          getThemeTokenContrast({
            background,
            foreground: appliedFocus,
            theme,
          }),
        ).toBeGreaterThanOrEqual(3);
      }
    },
  );
});
