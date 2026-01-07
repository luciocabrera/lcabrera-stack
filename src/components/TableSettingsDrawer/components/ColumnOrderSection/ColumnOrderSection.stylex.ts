import * as stylex from '@stylexjs/stylex';

import { spacing } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  container: {
    gap: spacing.md,
    // paddingBlock: spacing.md,
    // paddingInline: spacing.md,
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
    fontSize: '0.875rem',
  },
});
