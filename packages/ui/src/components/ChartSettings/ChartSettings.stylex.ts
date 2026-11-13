import * as stylex from '@stylexjs/stylex';

import { spacing } from '#ui/design-system/tokens/base.stylex';

export const chartSettingsStyles = stylex.create({
  block: {
    gap: spacing.xs,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  blockToolbar: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  inline: {
    gap: spacing.xxs,
    alignItems: 'center',
    display: 'inline-flex',
  },
});
