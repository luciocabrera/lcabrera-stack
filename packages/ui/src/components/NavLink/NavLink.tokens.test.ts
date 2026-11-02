import * as stylex from '@stylexjs/stylex';
import { describe, expect, it } from 'vite-plus/test';

import type { ThemeName } from '#ui/utils/tests/tests.types';

import { colors } from '#ui/design-system/tokens/colors.stylex';
import { compileStylexRules } from '#ui/utils/tests/compileStylexRules.util';
import { getColorTokenName } from '#ui/utils/tests/getColorTokenName.util';
import { getThemeTokenContrast } from '#ui/utils/tests/getThemeTokenContrast.util';
import { readStylexDeclaration } from '#ui/utils/tests/readStylexDeclaration.util';

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

type ReadArgs = {
  readonly property: string;
  readonly pseudo?: string;
};

const read = ({ property, pseudo }: ReadArgs) =>
  readStylexDeclaration({
    className: inlineClassName,
    property,
    pseudo,
    rules,
  });

describe('the inline NavLink colour tokens', () => {
  it('compiles the NavLink style module', () => {
    expect(rules.length).toBeGreaterThan(0);
  });

  it('underlines the link at rest and thickens the underline on hover and focus', () => {
    expect(inlineClassName).toBe(
      stylex.props(linkItemStyles.inline.link).className,
    );
    expect(read({ property: 'text-decoration-line' })).toBe('underline');
    expect(read({ property: 'text-decoration-thickness' })).toBe('1px');
    expect(
      read({ property: 'text-decoration-thickness', pseudo: ':hover' }),
    ).toBe('2px');
    expect(
      read({ property: 'text-decoration-thickness', pseudo: ':focus-visible' }),
    ).toBe('2px');
    expect(read({ property: 'outline' })).toBe('none');
  });

  it('keeps the underline in the active and pending states', () => {
    const active = getInlineClassName({
      isActive: true,
      isPending: false,
      styles: linkItemStyles,
    });
    const pending = getInlineClassName({
      isActive: false,
      isPending: true,
      styles: linkItemStyles,
    });

    expect(
      readStylexDeclaration({
        className: active,
        property: 'text-decoration-line',
        rules,
      }),
    ).toBe('underline');
    expect(
      readStylexDeclaration({
        className: active,
        property: 'text-decoration-thickness',
        rules,
      }),
    ).toBe('2px');
    expect(
      readStylexDeclaration({
        className: pending,
        property: 'text-decoration-line',
        rules,
      }),
    ).toBe('underline');
    expect(
      readStylexDeclaration({
        className: pending,
        property: 'text-decoration-style',
        rules,
      }),
    ).toBe('dotted');
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

  it('falls below the 3:1 a colour-only link needs against primary body text in both themes, so it is underlined at rest', () => {
    for (const theme of THEMES) {
      expect(
        getThemeTokenContrast({
          background: colors.textPrimary,
          foreground: appliedText,
          theme,
        }),
      ).toBeLessThan(3);
    }
  });
});
