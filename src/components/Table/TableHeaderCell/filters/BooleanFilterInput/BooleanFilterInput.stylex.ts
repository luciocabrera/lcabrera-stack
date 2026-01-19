import * as stylex from '@stylexjs/stylex';

import { spacing } from '@/design-system/tokens/base.stylex';

const baseStyles = stylex.create({
  container: {
    gap: spacing.sm,
    display: 'flex',
    flexDirection: 'column',
  },
});

export const styles = {
  container: baseStyles.container,
};
