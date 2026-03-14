import * as stylex from '@stylexjs/stylex';

import { spacing } from '@/design-system/tokens/base.stylex';

export const styles = stylex.create({
  container: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0,
  },
  section: {
    flex: '1',
    gap: spacing.md,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },
});
