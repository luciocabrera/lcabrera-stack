import * as stylex from '@stylexjs/stylex';

import { spacing } from '#ui/design-system/tokens/base.stylex';

export const styles = stylex.create({
  footer: {
    paddingInline: spacing.sm,
    display: 'flex',
    flexDirection: 'column',
    marginTop: 'auto',
  },
});
