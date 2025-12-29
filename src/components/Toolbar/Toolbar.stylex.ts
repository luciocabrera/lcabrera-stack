import * as stylex from '@stylexjs/stylex';

import { spacing } from '@/design-system/tokens/base.stylex';

export const styles = stylex.create({
  toolbar: {
    containerName: 'toolbar',
    containerType: 'inline-size',
    display: 'flex',
    gap: spacing.xs,
    listStyle: 'none',
    margin: 0,
    padding: 0,
    width: '100%',
  },

  toolbarHorizontal: {
    '@container toolbar (max-width: 400px)': {
      flexDirection: 'column',
    },
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  toolbarVertical: {
    flexDirection: 'column',
    flexWrap: 'nowrap',
  },

  toolbarItem: {
    display: 'flex',
    flex: '0 0 auto',
  },

  toolbarItemResponsive: {
    '@container toolbar (max-width: 400px)': {
      flex: '1 1 100%',
    },
  },
});
