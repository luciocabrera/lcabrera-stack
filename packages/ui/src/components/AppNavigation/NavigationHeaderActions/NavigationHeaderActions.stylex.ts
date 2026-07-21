import { spacing } from '@lcabrera/ui/design-system/tokens/base.stylex';
import * as stylex from '@stylexjs/stylex';

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
