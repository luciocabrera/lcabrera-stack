import * as stylex from '@stylexjs/stylex';

import { spacing, typography } from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

export const tableGroupShareStyles = stylex.create({
  /** The "no denominator" state, dimmed the way an absent aggregate is. */
  absent: {
    color: colors.textSecondary,
    opacity: 0.55,
  },
  barFill: (width: string) => ({
    borderRadius: 'inherit',
    backgroundColor: colors.info,
    display: 'block',
    height: '100%',
    width,
  }),
  barTrack: {
    borderRadius: spacing.xxs,
    overflow: 'hidden',
    backgroundColor: colors.borderSecondary,
    display: 'block',
    flexShrink: 0,
    height: 4,
    width: 48,
  },
  container: {
    gap: spacing.xxs,
    alignItems: 'center',
    display: 'inline-flex',
    flexShrink: 0,
  },
  value: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeXs,
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  },
});
