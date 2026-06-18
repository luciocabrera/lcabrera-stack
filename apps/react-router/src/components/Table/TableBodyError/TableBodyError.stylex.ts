import * as stylex from '@stylexjs/stylex';

import { spacing } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  panel: {
    padding: spacing.xl,
    overflow: 'hidden',
    alignContent: 'center',
    alignItems: 'center',
    display: 'flex',
    isolation: 'isolate',
    justifyContent: 'center',
    position: 'relative',
    // borderColor: colors.borderPrimary,
    // borderRadius: '12px',
    // borderStyle: 'solid',
    // borderWidth: '1px',
    // backgroundColor: colors.errorBackground,
    textAlign: 'center',
    height: '100%',
    // maxWidth: '760px',
    width: '100%',
  },
  overlay: {
    background: `
      linear-gradient(140deg, #04070f 0%, #070d1f 42%, #0a1730 100%)
    `,
    inset: 0,
    transition: 'background 0.5s ease',
    opacity: 1,
    pointerEvents: 'none',
    position: 'absolute',
    zIndex: 0,
    height: '100%',
    width: '100%',
    '::after': {
      inset: 0,
      backgroundImage:
        "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.05'/></svg>\")",
      content: '',
      mixBlendMode: 'soft-light',
      opacity: 0.28,
      pointerEvents: 'none',
      position: 'absolute',
    },
    '::before': {
      background: `
        radial-gradient(42% 46% at 16% 24%, rgba(79, 136, 255, 0.9), transparent 72%),
        radial-gradient(40% 42% at 82% 24%, rgba(28, 230, 193, 0.78), transparent 72%),
        radial-gradient(46% 50% at 84% 80%, rgba(198, 120, 255, 0.72), transparent 74%),
        radial-gradient(36% 38% at 52% 62%, rgba(126, 155, 255, 0.55), transparent 76%)
      `,
      inset: '-16% -10%',
      content: '',
      filter: 'blur(72px) saturate(145%)',
      opacity: 0.92,
      pointerEvents: 'none',
      position: 'absolute',
      transform: 'scale(1.08)',
    },
  },

  content: {
    marginInline: 'auto',
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    zIndex: 1,
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
