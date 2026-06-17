import * as stylex from '@stylexjs/stylex';

import { spacing } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  panel: {
    backgroundColor: colors.errorBackground,
    borderColor: colors.borderPrimary,
    borderRadius: '12px',
    borderStyle: 'solid',
    borderWidth: '1px',
    maxWidth: '760px',
    padding: spacing.xl,
    textAlign: 'center',
    width: '100%',
  },
  content: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    marginInline: 'auto',
    maxWidth: '520px',
  },
  details: {
    color: colors.errorCardText,
    fontSize: '0.8rem',
    fontStyle: 'italic',
    marginBlock: spacing.sm,
    overflowWrap: 'break-word',
    wordBreak: 'break-all',
  },
  eyebrow: {
    color: colors.error,
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.04em',
    margin: 0,
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
    backgroundColor: colors.error,
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
    color: colors.error,
    fontSize: '1.1rem',
    fontWeight: 600,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
});
