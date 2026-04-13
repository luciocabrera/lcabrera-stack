import * as stylex from '@stylexjs/stylex';

import { spacing } from '@/design-system/tokens/base.stylex';

export const styles = stylex.create({
  container: {
    alignItems: 'center',
    display: 'flex',
    flex: '1',
    flexDirection: 'column',
    gap: spacing.md,
    justifyContent: 'center',
    padding: spacing.xl,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: 'var(--brand-primary)',
    borderRadius: '4px',
    borderStyle: 'none',
    color: 'var(--brand-primary-text)',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    marginTop: spacing.md,
    paddingBlock: spacing.sm,
    paddingInline: spacing.lg,
  },
  title: {
    color: 'var(--error)',
    fontSize: '1.5rem',
    fontWeight: 600,
    margin: 0,
  },
});
