import type { StyleXStyles } from '@stylexjs/stylex';

import * as stylex from '@stylexjs/stylex';
import { describe, expect, it } from 'vite-plus/test';

import { styles as formFieldChromeStyles } from '#ui/components/Form/FormFieldChrome/FormFieldChrome.stylex';
import { styles as infoBoxStyles } from '#ui/components/InfoBox/InfoBox.stylex';
import { styles as notificationItemStyles } from '#ui/components/NotificationCenter/NotificationItem/NotificationItem.stylex';
import { styles as statusBadgeStyles } from '#ui/components/StatusBadge/StatusBadge.stylex';
import { styles as detailsSectionStyles } from '#ui/components/Table/ColumnSettingsDrawer/DetailsSection/DetailsSection.stylex';
import { styles as textStyles } from '#ui/components/Text/Text.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';
import { compileStylexRules } from '#ui/utils/tests/compileStylexRules.util';
import { getThemeTokenContrast } from '#ui/utils/tests/getThemeTokenContrast.util';
import { readStylexDeclaration } from '#ui/utils/tests/readStylexDeclaration.util';

const SOURCES = import.meta.glob<string>(
  [
    '../../components/Form/FormFieldChrome/FormFieldChrome.stylex.ts',
    '../../components/InfoBox/InfoBox.stylex.ts',
    '../../components/NotificationCenter/NotificationItem/NotificationItem.stylex.ts',
    '../../components/StatusBadge/StatusBadge.stylex.ts',
    '../../components/Table/ColumnSettingsDrawer/DetailsSection/DetailsSection.stylex.ts',
    '../../components/Text/Text.stylex.ts',
  ],
  { eager: true, import: 'default', query: '?raw' },
);

const rules = await compileStylexRules(
  Object.entries(SOURCES).map(([path, source]) => ({
    path: path.replace('../../', ''),
    source,
  })),
);

const WCAG_AA_BODY_TEXT = 4.5;

const THEMES = ['light', 'dark'] as const;

const PAGE_BACKGROUNDS = [
  'backgroundPrimary',
  'backgroundSecondary',
  'backgroundTertiary',
  'surfacePrimary',
  'surfaceSecondary',
  'surfaceElevated',
] as const;

type StyledText = {
  readonly name: string;
  readonly style: StyleXStyles;
};

type TextOnBackgrounds = StyledText & {
  readonly backgrounds: readonly (typeof PAGE_BACKGROUNDS)[number][];
};

const WASH_TEXT: readonly StyledText[] = [
  ...Object.entries(statusBadgeStyles.tone).map(([tone, style]) => ({
    name: `StatusBadge ${tone}`,
    style,
  })),
  ...Object.entries(infoBoxStyles.tone).map(([tone, style]) => ({
    name: `InfoBox ${tone}`,
    style,
  })),
  { name: 'DetailsSection badgeNo', style: detailsSectionStyles.badgeNo },
  { name: 'DetailsSection badgeNone', style: detailsSectionStyles.badgeNone },
  { name: 'DetailsSection badgeYes', style: detailsSectionStyles.badgeYes },
];

const PAGE_TEXT: readonly TextOnBackgrounds[] = [
  ...(['error', 'info', 'success', 'warning'] as const).map((tone) => ({
    backgrounds: PAGE_BACKGROUNDS,
    name: `Text ${tone}`,
    style: textStyles.tone[tone],
  })),
  {
    backgrounds: PAGE_BACKGROUNDS,
    name: 'FormFieldChrome error',
    style: formFieldChromeStyles.error,
  },
  {
    backgrounds: PAGE_BACKGROUNDS,
    name: 'FormFieldChrome required',
    style: formFieldChromeStyles.required,
  },
  ...(['Error', 'Info', 'Success', 'Warning'] as const).map((tone) => ({
    backgrounds: ['surfacePrimary'] as const,
    name: `NotificationItem dismissButton${tone}`,
    style: notificationItemStyles[`dismissButton${tone}`],
  })),
];

type ReadArgs = {
  readonly property: string;
  readonly style: StyleXStyles;
};

const read = ({ property, style }: ReadArgs) =>
  readStylexDeclaration({
    className: stylex.props(style).className,
    property,
    rules,
  });

const WASH_CASES = THEMES.flatMap((theme) =>
  WASH_TEXT.map((text) => ({ ...text, theme })),
);

const PAGE_CASES = THEMES.flatMap((theme) =>
  PAGE_TEXT.flatMap(({ backgrounds, ...text }) =>
    backgrounds.map((background) => ({ ...text, background, theme })),
  ),
);

describe('status text as the components draw it', () => {
  it('compiles every style module it reads', () => {
    expect(Object.keys(SOURCES)).toHaveLength(6);
    expect(rules.length).toBeGreaterThan(0);
  });

  it.each(WASH_CASES)(
    '$theme $name meets WCAG AA on its own background',
    ({ style, theme }) => {
      const background = read({ property: 'background-color', style });
      const foreground = read({ property: 'color', style });

      expect(background).toBeDefined();
      expect(foreground).toBeDefined();
      expect(
        getThemeTokenContrast({
          background: background ?? '',
          foreground: foreground ?? '',
          theme,
        }),
      ).toBeGreaterThanOrEqual(WCAG_AA_BODY_TEXT);
    },
  );

  it.each(PAGE_CASES)(
    '$theme $name meets WCAG AA on $background',
    ({ background, style, theme }) => {
      const foreground = read({ property: 'color', style });

      expect(foreground).toBeDefined();
      expect(
        getThemeTokenContrast({
          background: colors[background],
          foreground: foreground ?? '',
          theme,
        }),
      ).toBeGreaterThanOrEqual(WCAG_AA_BODY_TEXT);
    },
  );
});
