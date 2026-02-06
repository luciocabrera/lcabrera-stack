import * as stylex from '@stylexjs/stylex';

import { spacing, typography } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  container: {
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
});
