import * as stylex from '@stylexjs/stylex';

import { spacing, typography } from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

export const tableGroupHeaderRowStyles = stylex.create({
  /**
   * One cell spanning the row. It takes its height from the row rather than
   * declaring one, so the group row paints at exactly the `rowHeight`
   * `TableRow` applies — the identity the virtualization spacers are computed
   * against (see `TableRow/ARCHITECTURE.md`).
   */
  cell: {
    gap: spacing.xs,
    paddingInline: spacing.sm,
    alignItems: 'center',
    color: colors.textPrimary,
    display: 'flex',
    flexGrow: 1,
    fontSize: typography.fontSizeSm,
    fontWeight: typography.fontWeightSemibold,
    height: '100%',
    maxHeight: '100%',
    minWidth: 0,
  },
  count: {
    color: colors.textSecondary,
    fontWeight: typography.fontWeightNormal,
  },
  icon: {
    alignItems: 'center',
    color: colors.textSecondary,
    display: 'inline-flex',
    flexShrink: 0,
  },
  label: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  row: {
    backgroundColor: colors.surfaceSecondary,
  },
});
