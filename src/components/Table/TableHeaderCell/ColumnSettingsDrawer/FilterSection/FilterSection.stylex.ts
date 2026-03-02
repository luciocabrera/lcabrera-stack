import * as stylex from '@stylexjs/stylex';

const localStyles = stylex.create({
  container: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0,
  },
});

export const styles = {
  container: localStyles.container,
};
