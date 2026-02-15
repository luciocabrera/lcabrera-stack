import * as stylex from '@stylexjs/stylex';

import { spacing, typography } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';
import { borderRadius } from '@/design-system/tokens/base.stylex';

export const styles = stylex.create({
  container: {
    gap: spacing.sm,
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
  select: {
    borderColor: colors.borderPrimary,
    borderRadius: borderRadius.md,
    borderStyle: 'solid',
    borderWidth: '1px',
    paddingBlock: spacing.sm,
    paddingInline: spacing.md,
    backgroundColor: colors.surfacePrimary,
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    width: '100%',
  },
});
