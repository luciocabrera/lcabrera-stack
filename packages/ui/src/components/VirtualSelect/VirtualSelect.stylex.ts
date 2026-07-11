import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  container: {
    boxSizing: 'border-box',
    position: 'relative',
    maxWidth: '100%',
    minWidth: 0,
    width: '100%',
  },
  containerFill: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },
});
