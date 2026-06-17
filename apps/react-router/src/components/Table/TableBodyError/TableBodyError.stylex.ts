import * as stylex from '@stylexjs/stylex';

import { spacing } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  panel: {
    padding: spacing.xl,
    borderColor: colors.borderPrimary,
    borderRadius: '12px',
    borderStyle: 'solid',
    borderWidth: '1px',
    backgroundColor: colors.errorBackground,
    textAlign: 'center',
    maxWidth: '760px',
    width: '100%',
  },
  content: {
    marginInline: 'auto',
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '520px',
  },
  details: {
    marginBlock: spacing.sm,
    color: colors.errorCardText,
    fontSize: '0.8rem',
    fontStyle: 'italic',
    overflowWrap: 'break-word',
    wordBreak: 'break-all',
  },
  eyebrow: {
    margin: 0,
    color: colors.error,
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  illustration: {
    display: 'block',
    height: '160px',
    marginBottom: spacing.md,
    maxWidth: '320px',
    width: '100%',
  },
  message: {
    color: colors.errorText,
    fontSize: '0.95rem',
    fontWeight: 500,
    lineHeight: 1.45,
    marginBottom: 0,
    marginTop: spacing.xs,
  },
  retryButton: {
    borderRadius: '4px',
    borderStyle: 'none',
    paddingBlock: spacing.sm,
    paddingInline: spacing.lg,
    backgroundColor: colors.error,
    color: 'var(--brand-primary-text)',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    marginTop: spacing.md,
  },
  title: {
    color: colors.error,
    fontSize: '1.1rem',
    fontWeight: 600,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
});
