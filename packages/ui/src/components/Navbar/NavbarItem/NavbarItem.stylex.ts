import { spacing } from '@lcabrera/ui/design-system/tokens/base.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  navbarItem: {
    flex: '0 0 auto',
    display: 'flex',
  },

  navbarItemCompact: {
    justifyContent: 'center',
  },

  navbarItemCompactEmbedded: {
    width: spacing.lg,
  },

  navbarItemCompactLg: {
    width: spacing.xxl,
  },

  navbarItemCompactMd: {
    width: '2.5rem',
  },

  navbarItemCompactMini: {
    width: '1.75rem',
  },

  navbarItemCompactSm: {
    width: spacing.xl,
  },

  navbarItemResponsive: {
    flex: {
      default: '0 0 auto',
      '@container navbar (max-width: 400px)': '1 1 100%',
    },
  },
});
