import { spacing } from '@lcabrera/ui/design-system/tokens/base.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  charts: {
    gap: spacing.md,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  },
  chart: {
    gap: spacing.xxs,
    display: 'flex',
    flexDirection: 'column',
  },
});
