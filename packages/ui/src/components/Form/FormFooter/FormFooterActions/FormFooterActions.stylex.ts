import * as stylex from '@stylexjs/stylex';

import { spacing } from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  // Deliberately the same chrome as `SidePanelFooter` (the table settings
  // drawer's footer): the rule is what separates a pinned action row from the
  // content scrolling behind it, so the two should not read differently. Not
  // shared through a recipe because `Modal`'s own footer slot wants a third
  // spelling (`spacing.lg` + `borderSecondary`) — one recipe would have to pick
  // a winner and silently restyle the other two.
  //
  // `flexShrink: 0` keeps the row at full height when FormBody's scroll region
  // is competing for space — without it the buttons collapse instead of the
  // fields scrolling.
  footer: {
    padding: spacing.sm,
    gap: spacing.md,
    display: 'flex',
    flexShrink: 0,
    justifyContent: 'flex-end',
    borderTopColor: colors.borderPrimary,
    borderTopStyle: 'solid',
    borderTopWidth: '1px',
  },
});
