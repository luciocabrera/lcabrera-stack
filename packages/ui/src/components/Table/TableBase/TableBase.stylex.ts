import * as stylex from '@stylexjs/stylex';

import type { TableDensity } from '#ui/components/Table/Table.types';

import { spacing, typography } from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

const baseStyles = stylex.create({
  table: {
    overflow: 'visible',
    backgroundColor: colors.surfacePrimary,
    borderCollapse: 'separate',
    borderSpacing: 0,
    display: 'table',
    flexDirection: 'column',
    minWidth: 0,
    width: '100%',
  },
});

const tableVariants = stylex.create({
  borderless: {
    borderWidth: 0,
  },
});

const densityVariables = stylex.create({
  levels: (
    bodyFontSize: string,
    bodyPaddingInline: string,
    headerFontSize: string,
    headerPaddingInline: string,
  ) => ({
    '--table-body-font-size': bodyFontSize,
    '--table-body-padding-inline': bodyPaddingInline,
    '--table-header-font-size': headerFontSize,
    '--table-header-padding-inline': headerPaddingInline,
  }),
});

export const tableDensityTokens = {
  comfortable: {
    bodyFontSize: typography.fontSizeSm,
    headerFontSize: typography.fontSizeSm,
    paddingInline: spacing.sm,
  },
  compact: {
    bodyFontSize: typography.fontSizeSm,
    headerFontSize: typography.fontSizeSm,
    paddingInline: spacing.xs,
  },
  dense: {
    bodyFontSize: typography.fontSizeXs,
    headerFontSize: typography.fontSizeXs,
    paddingInline: spacing.xxs,
  },
  spacious: {
    bodyFontSize: typography.fontSizeMd,
    headerFontSize: typography.fontSizeSm,
    paddingInline: spacing.md,
  },
} satisfies Readonly<
  Record<
    TableDensity,
    {
      readonly bodyFontSize: string;
      readonly headerFontSize: string;
      readonly paddingInline: string;
    }
  >
>;

export const tableStyles = {
  base: baseStyles.table,
  density: densityVariables.levels,
  variants: tableVariants,
};
