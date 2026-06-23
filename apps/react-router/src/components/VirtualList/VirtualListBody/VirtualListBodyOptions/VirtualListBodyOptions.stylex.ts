import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  virtualOffset: (offsetY: number) => ({
    transform: `translateY(${offsetY}px)`,
  }),
  virtualScrollArea: (height: number) => ({
    position: 'relative',
    height,
  }),
});
