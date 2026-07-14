import { spacing } from '@repo/ui/design-system/tokens/base.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  footer: {
    gap: spacing.sm,
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: spacing.lg,
  },
});
