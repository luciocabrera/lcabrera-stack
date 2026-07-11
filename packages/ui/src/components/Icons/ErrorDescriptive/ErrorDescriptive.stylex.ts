import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  svg: {
    display: 'block',
    height: 'auto',
    // Make sure SVG scales down nicely
    maxWidth: '560px',
    width: '100%',
  },
});
