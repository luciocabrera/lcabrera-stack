import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  cell: (width: number) => ({
    padding: 0,
    borderStyle: 'none',
    borderWidth: 0,
    flexShrink: 0,
    minWidth: width,
    width,
  }),
});
