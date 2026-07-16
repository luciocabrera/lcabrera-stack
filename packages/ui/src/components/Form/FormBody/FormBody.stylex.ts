import { spacing } from '@repo/ui/design-system/tokens/base.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  form: {
    gap: spacing.lg,
    display: 'flex',
    flexDirection: 'column',
  },
});
