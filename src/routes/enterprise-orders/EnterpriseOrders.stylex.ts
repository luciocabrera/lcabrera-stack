import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  container: {
    padding: '1rem',
    gap: '1rem',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  header: {
    flexShrink: 0,
  },
});
