import * as stylex from '@stylexjs/stylex';

import { spacing } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  panel: {
    padding: spacing.xl,
    overflow: 'hidden',
    alignContent: 'center',
    alignItems: 'center',
    backgroundColor: '#04070f', //  this must be for the light theme #ffffff00
    display: 'flex',
    isolation: 'isolate',
    justifyContent: 'center',
    position: 'relative',
    textAlign: 'center',
    height: '100%',
    width: '100%',
  },
  overlay: {
    inset: 0,
    backgroundColor: colors.backgroundPrimary, //    '#050814',
    backgroundImage:
      'radial-gradient(46% 52% at 18% 25%, rgba(90, 144, 255, 0.95), transparent 71%), radial-gradient(44% 44% at 82% 24%, rgba(40, 228, 194, 0.86), transparent 71%), radial-gradient(52% 56% at 84% 82%, rgba(196, 120, 255, 0.84), transparent 73%), radial-gradient(40% 40% at 53% 62%, rgba(126, 158, 255, 0.64), transparent 74%)',
    filter: 'blur(72px) saturate(150%) brightness(0.5)',
    mixBlendMode: 'screen',
    opacity: 0.5,
    pointerEvents: 'none',
    position: 'absolute',
    zIndex: 0,
    height: '100%',
    width: '100%',
  },
  glow: {
    inset: '-16% -10%',
    backgroundImage:
      'radial-gradient(46% 52% at 18% 25%, rgba(90, 144, 255, 0.95), transparent 71%), radial-gradient(44% 44% at 82% 24%, rgba(40, 228, 194, 0.86), transparent 71%), radial-gradient(52% 56% at 84% 82%, rgba(196, 120, 255, 0.84), transparent 73%), radial-gradient(40% 40% at 53% 62%, rgba(126, 158, 255, 0.64), transparent 74%)',
    filter: 'blur(72px) saturate(150%) brightness(0.5)',
    mixBlendMode: 'screen',
    opacity: 0.5,
    pointerEvents: 'none',
    position: 'absolute',
  },
  noise: {
    inset: 0,
    backgroundImage:
      "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.08'/></svg>\")",
    mixBlendMode: 'soft-light',
    opacity: 0.3,
    pointerEvents: 'none',
    position: 'absolute',
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
