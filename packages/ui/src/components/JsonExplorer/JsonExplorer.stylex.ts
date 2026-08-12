import * as stylex from '@stylexjs/stylex';

import { spacing } from '#ui/design-system/tokens/base.stylex';

export const styles = stylex.create({
  sectionHeader: {
    paddingBlock: spacing.xs,
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'flex-end',
  },
});
