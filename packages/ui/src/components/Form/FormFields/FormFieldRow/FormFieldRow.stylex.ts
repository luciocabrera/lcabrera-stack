import { spacing } from '@lcabrera/ui/design-system/tokens/base.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  cell: (grow: number) => ({
    flex: `${grow} 1 0`,
    minWidth: 0,
  }),
  row: {
    gap: spacing.md,
    display: 'flex',
    flexDirection: 'row',
  },
});
