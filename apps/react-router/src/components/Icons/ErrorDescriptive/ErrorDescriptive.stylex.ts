import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  container: {
    gap: 12,
    alignItems: 'center',
    boxSizing: 'border-box' as const,
    // Let parent control color; default to a neutral muted tone if not set
    color: 'var(--error-illustration-color, currentColor)',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    // Prevent SVG from overflowing small containers
    maxWidth: '100%',
  },
  svg: {
    display: 'block',
    height: 'auto',
    // Make sure SVG scales down nicely
    maxWidth: '560px',
    width: '100%',
  },
  message: {
    padding: '0 8px',
    color: 'currentColor',
    fontSize: '14px',
    lineHeight: 1.3,
    opacity: 0.9,
    textAlign: 'center' as const,
    maxWidth: '36ch',
  },
});
