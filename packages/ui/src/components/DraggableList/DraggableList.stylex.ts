import * as stylex from '@stylexjs/stylex';

import { spacing } from '#ui/design-system/tokens/base.stylex';

export const styles = stylex.create({
  list: {
    margin: 0,
    padding: 0,
    gap: spacing.sm,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
  },
});
