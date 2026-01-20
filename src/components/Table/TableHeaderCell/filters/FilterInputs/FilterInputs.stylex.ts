import * as stylex from '@stylexjs/stylex';

import { spacing } from '@/design-system/tokens/base.stylex';

export const styles = stylex.create({
  stringFilterContainer: {
    gap: spacing.sm,
    display: 'flex',
    flexDirection: 'column',
  },
});
