import * as stylex from '@stylexjs/stylex';

import { spacing } from '@/design-system/tokens/base.stylex';

export const styles = stylex.create({
  toolbar: {
    margin: 0,
    padding: 0,
    gap: spacing.xs,
    listStyle: 'none',
    containerName: 'toolbar',
    containerType: 'inline-size',
    display: 'flex',
    width: '100%',
  },

  toolbarHorizontal: {
    flexDirection: {
      default: 'row',
      '@container toolbar (max-width: 400px)': 'column',
    },
    flexWrap: 'wrap',
  },

  toolbarVertical: {
    flexDirection: 'column',
    flexWrap: 'nowrap',
  },

  toolbarCompact: {
    alignItems: 'center',
  },

  compactControlEmbedded: {
    justifyContent: 'center',
    minWidth: spacing.lg,
    paddingInline: 0,
    width: spacing.lg,
  },

  compactControlLg: {
    justifyContent: 'center',
    minWidth: spacing.xxl,
    paddingInline: 0,
    width: spacing.xxl,
  },

  compactControlMd: {
    justifyContent: 'center',
    minWidth: '2.5rem',
    paddingInline: 0,
    width: '2.5rem',
  },

  compactControlMini: {
    justifyContent: 'center',
    minWidth: '1.75rem',
    paddingInline: 0,
    width: '1.75rem',
  },

  compactControlSm: {
    justifyContent: 'center',
    minWidth: spacing.xl,
    paddingInline: 0,
    width: spacing.xl,
  },

  toolbarItem: {
    flex: '0 0 auto',
    display: 'flex',
  },

  toolbarItemCompact: {
    justifyContent: 'center',
  },

  toolbarItemCompactEmbedded: {
    width: spacing.lg,
  },

  toolbarItemCompactLg: {
    width: spacing.xxl,
  },

  toolbarItemCompactMd: {
    width: '2.5rem',
  },

  toolbarItemCompactMini: {
    width: '1.75rem',
  },

  toolbarItemCompactSm: {
    width: spacing.xl,
  },

  toolbarItemResponsive: {
    flex: {
      default: '0 0 auto',
      '@container toolbar (max-width: 400px)': '1 1 100%',
    },
  },
});
