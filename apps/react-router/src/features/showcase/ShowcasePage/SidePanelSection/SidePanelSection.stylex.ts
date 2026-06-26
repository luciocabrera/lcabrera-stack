import * as stylex from '@stylexjs/stylex';

import { spacing } from '@/design-system/tokens/base.stylex';

export const styles = stylex.create({
  buttonRow: {
    display: 'flex',
    gap: spacing.xs,
  },
  iconLeft: {
    alignItems: 'center',
    display: 'inline-flex',
    marginRight: spacing.xs,
  },
  iconRight: {
    alignItems: 'center',
    display: 'inline-flex',
    marginLeft: spacing.xs,
  },
  panelContent: {
    marginTop: spacing.md,
  },
});
