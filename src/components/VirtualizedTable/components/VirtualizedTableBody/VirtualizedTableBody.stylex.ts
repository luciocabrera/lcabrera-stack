import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  body: (height: number) => ({
    display: 'grid',
    height,
    position: 'relative',
  }),
  spacerCell: (height: number) => ({
    borderStyle: 'none',
    borderWidth: 0,
    height,
    padding: 0,
  }),
  spacerRow: (height: number) => ({
    height,
  }),
});
