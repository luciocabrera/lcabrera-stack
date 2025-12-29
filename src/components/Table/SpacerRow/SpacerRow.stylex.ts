import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  cell: (height: number) => ({
    padding: 0,
    borderStyle: 'none',
    borderWidth: 0,
    height,
  }),
  row: (height: number) => ({
    height,
  }),
});
