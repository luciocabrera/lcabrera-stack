import * as stylex from '@stylexjs/stylex';

import { borderRadius, spacing } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  container: {
    gap: spacing.md,
    paddingBlock: spacing.md,
    paddingInline: spacing.md,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    margin: 0,
    color: colors.textSecondary,
    fontSize: '0.875rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  addSection: {
    gap: spacing.sm,
    display: 'flex',
    flexDirection: 'column',
  },
  select: {
    borderColor: colors.borderPrimary,
    borderRadius: borderRadius.md,
    borderStyle: 'solid',
    borderWidth: '1px',
    paddingBlock: spacing.sm,
    paddingInline: spacing.md,
    backgroundColor: colors.surfacePrimary,
    color: colors.textPrimary,
    fontSize: '0.875rem',
    width: '100%',
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
    fontSize: '0.875rem',
  },
  sortItemControls: {
    gap: spacing.xs,
    alignItems: 'center',
    display: 'flex',
    flexShrink: 0,
  },
  emptyState: {
    paddingBlock: spacing.lg,
    color: colors.textTertiary,
    fontSize: '0.875rem',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
