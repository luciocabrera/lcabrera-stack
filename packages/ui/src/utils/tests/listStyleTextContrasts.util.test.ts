import * as stylex from '@stylexjs/stylex';
import { describe, expect, it } from 'vite-plus/test';

import { colors } from '#ui/design-system/tokens/colors.stylex';

import { getThemeTokenContrast } from './getThemeTokenContrast.util';
import { listStyleTextContrasts } from './listStyleTextContrasts.util';

const fixture = stylex.create({
  bare: { margin: 0 },
  onPage: { color: colors.textPrimary },
  onWash: {
    backgroundColor: colors.errorBackground,
    color: colors.errorCardText,
  },
});

const classOf = (style: (typeof fixture)[keyof typeof fixture]) =>
  stylex.props(style).className?.split(' ') ?? [];

const [washFirst = '', washSecond = ''] = classOf(fixture.onWash);
const [pageClass = ''] = classOf(fixture.onPage);

const RULES = [
  {
    className: washFirst,
    property: 'background-color',
    pseudo: '',
    value: colors.errorBackground,
  },
  {
    className: washSecond,
    property: 'background-color',
    pseudo: '',
    value: colors.errorBackground,
  },
  {
    className: washFirst,
    property: 'color',
    pseudo: '',
    value: colors.errorCardText,
  },
  {
    className: washSecond,
    property: 'color',
    pseudo: '',
    value: colors.errorCardText,
  },
  {
    className: pageClass,
    property: 'color',
    pseudo: '',
    value: colors.textPrimary,
  },
];

describe('listStyleTextContrasts', () => {
  it('measures a style against the background it sets, in both themes', () => {
    expect(
      listStyleTextContrasts({
        rules: RULES,
        styles: { onWash: fixture.onWash },
      }),
    ).toEqual([
      {
        background: 'errorBackground',
        name: 'onWash',
        ratio: getThemeTokenContrast({
          background: colors.errorBackground,
          foreground: colors.errorCardText,
          theme: 'light',
        }),
        theme: 'light',
      },
      {
        background: 'errorBackground',
        name: 'onWash',
        ratio: getThemeTokenContrast({
          background: colors.errorBackground,
          foreground: colors.errorCardText,
          theme: 'dark',
        }),
        theme: 'dark',
      },
    ]);
  });

  it('measures a style against each background named', () => {
    const measured = listStyleTextContrasts({
      backgrounds: [colors.backgroundPrimary, colors.surfaceElevated],
      rules: RULES,
      styles: { onPage: fixture.onPage },
    });

    expect(
      measured.map(({ background, theme }) => `${theme} ${background}`),
    ).toEqual([
      'light backgroundPrimary',
      'light surfaceElevated',
      'dark backgroundPrimary',
      'dark surfaceElevated',
    ]);
  });

  it('refuses a style that sets no text colour', () => {
    expect(() =>
      listStyleTextContrasts({ rules: RULES, styles: { bare: fixture.bare } }),
    ).toThrow('bare sets no text colour or no background');
  });

  it('refuses a style that sets no background when none is named', () => {
    expect(() =>
      listStyleTextContrasts({
        rules: RULES,
        styles: { onPage: fixture.onPage },
      }),
    ).toThrow('onPage sets no text colour or no background');
  });
});
