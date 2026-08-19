import * as stylex from '@stylexjs/stylex';

import { spacing, typography } from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

export const tableGroupShareStyles = stylex.create({
  /** The "no denominator" state, dimmed the way an absent aggregate is. */
  absent: {
    color: colors.textSecondary,
    opacity: 0.55,
  },
  /**
   * The filled portion. Its width is the datum itself, so it is a **dynamic**
   * style rather than an inline one: StyleX compiles a style function to a
   * custom property, which keeps the value out of a `style` attribute and so
   * out of the way of a strict CSP (ADR-005, and the same shape
   * `TableBodyCell`'s pinned offsets take).
   */
  barFill: (width: string) => ({
    backgroundColor: colors.brandPrimary,
    borderRadius: 'inherit',
    height: '100%',
    width,
  }),
  barTrack: {
    backgroundColor: colors.borderSecondary,
    borderRadius: spacing.xxs,
    flexShrink: 0,
    height: 4,
    overflow: 'hidden',
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
