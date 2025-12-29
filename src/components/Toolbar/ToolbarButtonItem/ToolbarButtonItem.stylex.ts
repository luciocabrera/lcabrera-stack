import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  itemIcon: {
    alignItems: 'center',
    display: 'flex',
    flexShrink: 0,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },

  itemLabel: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
});
