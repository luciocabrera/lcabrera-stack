import * as stylex from '@stylexjs/stylex';

import { spacing } from '@/design-system/tokens/base.stylex';

/**
 * ErrorBoundary Component Styles
 * Centered error display with retry action
 */

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
  },
  retryButton: {
    borderRadius: '4px',
    borderStyle: 'none',
    paddingBlock: spacing.sm,
    paddingInline: spacing.lg,
    backgroundColor: 'var(--brand-primary)',
    color: 'var(--brand-primary-text)',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    marginTop: spacing.md,
  },
  title: {
    margin: 0,
    color: 'var(--error)',
    fontSize: '1.5rem',
    fontWeight: 600,
  },
});
