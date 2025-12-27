import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  body: (height: number) => ({
    display: 'grid',
    position: 'relative',
    height,
  }),
  spacerCell: (height: number) => ({
    padding: 0,
    borderStyle: 'none',
    borderWidth: 0,
    height,
  }),
  spacerRow: (height: number) => ({
    height,
  }),
});
