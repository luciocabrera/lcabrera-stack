import { spacing } from '@lcabrera/ui/design-system/tokens/base.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  container: {
    gap: spacing.sm,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
  },
});
