import * as stylex from '@stylexjs/stylex';

import { spacing } from '@repo/ui/design-system/tokens/base.stylex';

export const styles = stylex.create({
  group: {
    gap: spacing.sm,
    display: 'flex',
    flexDirection: 'column',
  },
  groupLabel: {
    fontWeight: 600,
  },
});
