import * as stylex from '@stylexjs/stylex';

import { spacing } from '@/design-system/tokens/base.stylex';

export const styles = stylex.create({
  container: {
    gap: spacing.md,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
});
