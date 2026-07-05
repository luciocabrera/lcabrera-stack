import * as stylex from '@stylexjs/stylex';

import { spacing } from '@repo/ui/design-system/tokens/base.stylex';

export const styles = stylex.create({
  row: {
    gap: spacing.md,
    display: 'flex',
    flexDirection: 'row',
  },
  rowField: {
    flex: 1,
  },
});
