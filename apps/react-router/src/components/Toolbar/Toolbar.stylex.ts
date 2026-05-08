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

  compactControl: {
    paddingInline: 0,
    justifyContent: 'center',
    minWidth: '2.5rem',
    width: '2.5rem',
  },

  toolbarItem: {
    flex: '0 0 auto',
    display: 'flex',
  },

  toolbarItemCompact: {
    justifyContent: 'center',
    width: '2.5rem',
  },

  toolbarItemResponsive: {
    flex: {
      default: '0 0 auto',
      '@container toolbar (max-width: 400px)': '1 1 100%',
    },
  },
});
