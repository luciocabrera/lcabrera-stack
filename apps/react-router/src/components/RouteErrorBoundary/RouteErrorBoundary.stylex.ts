import * as stylex from '@stylexjs/stylex';

import { spacing } from '@/design-system/tokens/base.stylex';

export const styles = stylex.create({
  container: {
    padding: spacing.xl,
    flex: '1',
    gap: spacing.md,
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    textAlign: 'center',
    height: '-webkit-fill-available',
  },
  actions: {
    gap: spacing.md,
    display: 'flex',
    width: 'min(500px, 90%)',
  },

  title: {
    margin: 0,
    color: 'var(--error)',
    fontSize: '1.5rem',
    fontWeight: 600,
  },
});
