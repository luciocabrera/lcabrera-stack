import { spacing } from '@lcabrera/ui/design-system/tokens/base.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  alert: {
    gap: spacing.xs,
    display: 'flex',
    flexDirection: 'column',
  },
  grid: {
    gap: spacing.lg,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  },
});
