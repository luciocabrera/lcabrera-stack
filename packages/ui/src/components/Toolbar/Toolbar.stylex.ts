import * as stylex from '@stylexjs/stylex';

import { spacing } from '@repo/ui/design-system/tokens/base.stylex';

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
