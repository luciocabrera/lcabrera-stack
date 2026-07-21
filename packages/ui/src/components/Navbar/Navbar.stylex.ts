import { spacing } from '@lcabrera/ui/design-system/tokens/base.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  navbar: {
    margin: 0,
    padding: 0,
    gap: spacing.xs,
    listStyle: 'none',
    containerName: 'navbar',
    containerType: 'inline-size',
    display: 'flex',
    width: '100%',
  },

  navbarHorizontal: {
    flexDirection: {
      default: 'row',
      '@container navbar (max-width: 400px)': 'column',
    },
    flexWrap: 'wrap',
  },

  navbarVertical: {
    flexDirection: 'column',
    flexWrap: 'nowrap',
  },

  navbarCompact: {
    alignItems: 'center',
  },

  compactControlEmbedded: {
    paddingInline: 0,
    justifyContent: 'center',
    minWidth: spacing.lg,
    width: spacing.lg,
  },

  compactControlLg: {
    paddingInline: 0,
    justifyContent: 'center',
    minWidth: spacing.xxl,
    width: spacing.xxl,
  },

  compactControlMd: {
    paddingInline: 0,
    justifyContent: 'center',
    minWidth: '2.5rem',
    width: '2.5rem',
  },

  compactControlMini: {
    paddingInline: 0,
    justifyContent: 'center',
    minWidth: '1.75rem',
    width: '1.75rem',
  },

  compactControlSm: {
    paddingInline: 0,
    justifyContent: 'center',
    minWidth: spacing.xl,
    width: spacing.xl,
  },
});
