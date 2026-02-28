import * as stylex from '@stylexjs/stylex';

const localStyles = stylex.create({
  selectOverride: {
    borderRadius: 0,
    borderStyle: 'none',
    overflow: 'visible',
    backgroundColor: 'transparent',
  },
});

export const styles = {
  selectOverride: localStyles.selectOverride,
};
