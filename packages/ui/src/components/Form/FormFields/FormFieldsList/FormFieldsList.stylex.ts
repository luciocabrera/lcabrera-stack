import { spacing } from '@lcabrera/ui/design-system/tokens/base.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  stack: {
    gap: spacing.md,
    display: 'flex',
    flexDirection: 'column',
  },
});
