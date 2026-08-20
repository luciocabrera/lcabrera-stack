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
  /** One measure — its optional name, its value, and its share. */
  measure: {
    gap: spacing.xxs,
    alignItems: 'center',
    display: 'inline-flex',
    minWidth: 0,
  },
  /**
   * Which function this number is. Rendered only where the column carries more
   * than one, because with a single measure the cell is unambiguous and the
   * prefix would be noise in every column of every group row.
   */
  measureName: {
    color: colors.textSecondary,
    flexShrink: 0,
    fontSize: typography.fontSizeXs,
    whiteSpace: 'nowrap',
  },
  value: {
    overflow: 'hidden',
    fontWeight: typography.fontWeightSemibold,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
});
