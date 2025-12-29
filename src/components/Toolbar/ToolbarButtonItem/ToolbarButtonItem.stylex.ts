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
    flex: '1 1 auto',
    overflow: 'hidden',
    display: {
      default: 'block',
      '@container button (max-width: 60px)': 'none',
    },
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
});
