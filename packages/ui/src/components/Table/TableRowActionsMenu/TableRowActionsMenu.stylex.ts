import * as stylex from '@stylexjs/stylex';

import { spacing } from '#ui/design-system/tokens/base.stylex';

export const styles = stylex.create({
  // Layout only — the rule above this group is a TableActionsPopoverSeparator.
  // Consumer-supplied nodes arrive as an opaque ReactNode, so this group stacks
  // them the way the built-in items are stacked rather than leaving them to
  // whatever display the caller's markup happens to have.
  customActions: {
    gap: spacing.xxs,
    display: 'flex',
    flexDirection: 'column',
  },
});
