import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  dialog: {
    height: 'min(92vh, 780px)',
    maxHeight: 'min(92vh, 780px)',
    width: 'min(94vw, 1200px)',
  },
  flushBody: {
    scrollbarGutter: 'auto',
    paddingInline: 0,
    paddingBlockEnd: 0,
  },
});
