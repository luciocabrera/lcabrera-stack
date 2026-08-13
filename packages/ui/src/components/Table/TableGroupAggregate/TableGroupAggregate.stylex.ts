import * as stylex from '@stylexjs/stylex';

import { spacing, typography } from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

export const tableGroupAggregateStyles = stylex.create({
  /**
   * The "no aggregate here" state. Dimmed rather than absent, so it reads as a
   * question nobody asked rather than as a value that has not arrived.
   */
  absent: {
    color: colors.textSecondary,
    opacity: 0.55,
  },
  container: {
    gap: spacing.xxs,
    alignItems: 'center',
    display: 'flex',
    minWidth: 0,
    width: '100%',
  },
  filterIndicator: {
    alignItems: 'center',
    color: colors.textSecondary,
    display: 'inline-flex',
    flexShrink: 0,
  },
  value: {
    overflow: 'hidden',
    fontWeight: typography.fontWeightSemibold,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
});
