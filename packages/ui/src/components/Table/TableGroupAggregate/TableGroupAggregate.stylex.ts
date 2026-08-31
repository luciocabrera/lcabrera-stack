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
  /**
   * `justifyContent: inherit` rather than a value of its own: the container is `width: 100%`
   * inside a flex `<td>`, so it fills the cell and the cell's own `justify-content` reaches
   * nothing without this. Inheriting keeps the decision where the column's type is known —
   * `getCellStyleProps` — instead of hardcoding `flex-end` here, which would right-align a
   * measure and leave the em dash, the group key and the blanked cell wrong (#1018).
   */
  container: {
    gap: spacing.xxs,
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'inherit',
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
  value: {
    overflow: 'hidden',
    fontWeight: typography.fontWeightSemibold,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
});
