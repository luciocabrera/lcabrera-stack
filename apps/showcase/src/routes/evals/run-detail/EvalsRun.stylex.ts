import { spacing } from '@lcabrera/ui/design-system/tokens/base.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  header: {
    padding: spacing.lg,
    gap: spacing.md,
    display: 'flex',
    flexDirection: 'column',
  },
  page: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0,
  },
  table: {
    flexGrow: 1,
    minHeight: '400px',
  },
});
