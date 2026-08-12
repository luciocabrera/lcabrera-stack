import * as stylex from '@stylexjs/stylex';

import { spacing } from '#ui/design-system/tokens/base.stylex';

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
