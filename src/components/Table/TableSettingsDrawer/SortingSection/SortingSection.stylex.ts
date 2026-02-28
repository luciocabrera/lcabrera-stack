import * as stylex from '@stylexjs/stylex';

import { spacing, typography } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  container: {
    gap: spacing.md,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  header: {
    margin: 0,
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    fontWeight: 600,
    marginBottom: spacing.xs,
  },
  addSection: {
    gap: spacing.sm,
    display: 'flex',
    flexDirection: 'column',
  },
  sortList: {
    gap: spacing.sm,
    display: 'flex',
    flexDirection: 'column',
  },
  sortItem: {
    gap: spacing.sm,
    alignItems: 'center',
    display: 'flex',
  },
  sortItemLabel: {
    color: colors.textPrimary,
    flexGrow: 1,
    flexShrink: 1,
    fontSize: typography.fontSizeSm,
  },
  sortItemControls: {
    gap: spacing.xs,
    alignItems: 'center',
    display: 'flex',
    flexShrink: 0,
  },
  sortOrderSection: {
    gap: spacing.md,
    display: 'flex',
    flexDirection: 'column',
  },
  resetSection: {
    marginTop: 'auto',
    paddingTop: spacing.sm,
  },
});
