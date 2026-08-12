import * as stylex from '@stylexjs/stylex';

import { spacing, typography } from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  actions: {
    gap: spacing.sm,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  container: {
    margin: '0 auto',
    padding: spacing.lg,
    gap: spacing.lg,
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '52rem',
  },
  description: {
    margin: 0,
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    lineHeight: typography.lineHeightNormal,
  },
  tabSections: {
    gap: spacing.lg,
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    margin: 0,
    color: colors.textPrimary,
    fontSize: typography.fontSize3xl,
    fontWeight: typography.fontWeightSemibold,
    lineHeight: typography.lineHeightTight,
  },
});
