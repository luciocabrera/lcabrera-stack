import {
  spacing,
  typography,
} from '@lcabrera/ui/design-system/tokens/base.stylex';
import { colors } from '@lcabrera/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  caption: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    textAlign: 'start',
    paddingBottom: spacing.xs,
  },
  cell: {
    paddingBlock: spacing.xxs,
    paddingInline: spacing.sm,
    fontSize: typography.fontSizeSm,
    textAlign: 'start',
    borderBottomColor: colors.borderSecondary,
    borderBottomStyle: 'solid',
    borderBottomWidth: 1,
  },
  head: {
    color: colors.textSecondary,
    fontWeight: typography.fontWeightSemibold,
  },
  numeric: {
    fontVariantNumeric: 'tabular-nums',
    textAlign: 'end',
  },
  scroller: {
    maxWidth: '100%',
    overflowX: 'auto',
  },
  table: {
    borderCollapse: 'collapse',
    width: '100%',
  },
});
