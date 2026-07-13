import { spacing } from '@repo/ui/design-system/tokens/base.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  container: {
    gap: spacing.sm,
    display: 'flex',
    width: '100%',
  },
});
