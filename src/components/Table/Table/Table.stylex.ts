import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  shadows,
  spacing,
} from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

const baseStyles = stylex.create({
  table: {
    borderColor: colors.borderPrimary,
    borderRadius: borderRadius.lg,
    borderStyle: 'solid',
    borderWidth: '1px',
    overflow: 'visible',
    backgroundColor: colors.surfacePrimary,
    boxShadow: shadows.sm,
    display: 'table',
    flexDirection: 'column',
    minWidth: 0,
    width: '100%',
  },
});

const tableVariants = stylex.create({
  borderless: {
    borderWidth: 0,
    boxShadow: shadows.none,
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
