import * as stylex from '@stylexjs/stylex';

import { spacing } from '@repo/ui/design-system/tokens/base.stylex';

export const styles = stylex.create({
  section: {
    flex: '1',
    gap: spacing.md,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },
});
