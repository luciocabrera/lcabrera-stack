import * as stylex from '@stylexjs/stylex';

import { spacing } from '@repo/ui/design-system/tokens/base.stylex';

export const styles = stylex.create({
  sectionHeader: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'flex-end',
    paddingBlock: spacing.xs,
  },
});
