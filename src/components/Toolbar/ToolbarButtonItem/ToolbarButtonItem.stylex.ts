import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  itemIcon: {
    alignItems: 'center',
    display: 'flex',
    flexShrink: 0,
    justifyContent: 'center',
    height: 20,
    width: 20,
  },

  itemLabel: {
    '@container button (max-width: 60px)': {
      display: 'none',
    },
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
});
