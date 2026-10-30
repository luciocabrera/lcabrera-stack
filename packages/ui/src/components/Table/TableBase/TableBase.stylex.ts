import * as stylex from '@stylexjs/stylex';

import type { TableDensityStep } from '#ui/components/Table/Table.types';

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

type TableDensityVariables = {
  readonly bodyFontSize: string;
  readonly bodyPaddingInline: string;
  readonly headerBandFontSize: string;
  readonly headerFontSize: string;
  readonly headerPaddingInline: string;
};

const densityVariables = stylex.create({
  levels: (variables: TableDensityVariables) => ({
    '--table-body-font-size': variables.bodyFontSize,
    '--table-body-padding-inline': variables.bodyPaddingInline,
    '--table-header-band-font-size': variables.headerBandFontSize,
    '--table-header-font-size': variables.headerFontSize,
    '--table-header-padding-inline': variables.headerPaddingInline,
  }),
});

type ResolveDensityVariablesArgs = {
  readonly body: TableDensityStep;
  readonly header: TableDensityStep;
};

const resolveDensityVariables = ({
  body,
  header,
}: ResolveDensityVariablesArgs) =>
  densityVariables.levels({
    bodyFontSize: typography[body.bodyFontSize],
    bodyPaddingInline: spacing[body.paddingInline],
    headerBandFontSize: typography[header.headerBandFontSize],
    headerFontSize: typography[header.headerFontSize],
    headerPaddingInline: spacing[header.paddingInline],
  });

export const tableStyles = {
  base: baseStyles.table,
  density: resolveDensityVariables,
  variants: tableVariants,
};
