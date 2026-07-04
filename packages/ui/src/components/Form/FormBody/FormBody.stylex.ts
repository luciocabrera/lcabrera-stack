import * as stylex from '@stylexjs/stylex';

import { spacing } from '@repo/ui/design-system/tokens/base.stylex';

export const styles = stylex.create({
  footer: {
    gap: spacing.sm,
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: spacing.lg,
  },
  form: {
    gap: spacing.lg,
    display: 'flex',
    flexDirection: 'column',
  },
});
