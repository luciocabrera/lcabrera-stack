import * as stylex from '@stylexjs/stylex';

import { spacing, typography } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  container: {
    gap: spacing.md,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    margin: 0,
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    fontWeight: 600,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  columnItem: {
    gap: spacing.sm,
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
  },
  columnLabel: {
    color: colors.textPrimary,
    flexGrow: 1,
    flexShrink: 1,
    fontSize: typography.fontSizeSm,
  },
});
