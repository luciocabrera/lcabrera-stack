import { spacing } from '@repo/ui/design-system/tokens/base.stylex';
import { colors } from '@repo/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

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

const densityVariants = stylex.create({
  compact: {
    '--table-padding-block': spacing.xs,
    '--table-padding-inline': spacing.sm,
  },
  comfortable: {
    '--table-padding-block': spacing.sm,
    '--table-padding-inline': spacing.md,
  },
});

export const tableStyles = {
  base: baseStyles.table,
  density: densityVariants,
  variants: tableVariants,
};
