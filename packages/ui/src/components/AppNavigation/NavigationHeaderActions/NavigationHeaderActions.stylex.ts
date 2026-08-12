import * as stylex from '@stylexjs/stylex';

import { spacing } from '#ui/design-system/tokens/base.stylex';

export const headerActionsStyles = stylex.create({
  actions: {
    gap: spacing.xs,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  actionsCollapsed: {
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'center',
  },
});
