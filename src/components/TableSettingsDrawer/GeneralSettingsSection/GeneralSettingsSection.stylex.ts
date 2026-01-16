import * as stylex from '@stylexjs/stylex';

import { borderRadius, spacing, typography } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  container: {
    padding: spacing.md,
    gap: spacing.lg,
    display: 'flex',
    flexDirection: 'column',
  },

  section: {
    gap: spacing.md,
    display: 'flex',
    flexDirection: 'column',
  },

  sectionTitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    fontWeight: 600,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },

  buttonGroup: {
    gap: spacing.sm,
    display: 'flex',
    flexDirection: 'column',
  },

  infoBox: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    lineHeight: 1.5,
  },
});
