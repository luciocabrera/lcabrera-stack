import * as stylex from '@stylexjs/stylex';

import { spacing } from '#ui/design-system/tokens/base.stylex';

export const styles = stylex.create({
  header: {
    gap: spacing.xs,
    display: 'flex',
    flexDirection: 'column',
  },
});
