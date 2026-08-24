import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  // A constant-size dialog rather than Modal's content-hugging default: the
  // table inside virtualizes against a measured viewport, so a body that grew
  // with its rows would have nothing bounded to scroll. `maxHeight` has to be
  // restated — Modal's own `min(85vh, 600px)` cap would otherwise clamp this
  // `height`.
  dialog: {
    height: 'min(92vh, 780px)',
    maxHeight: 'min(92vh, 780px)',
    width: 'min(94vw, 1200px)',
  },
  // The table draws its own toolbar, header rule and horizontal scroll, so
  // Modal's inline inset would sit a second margin inside those. The block-start
  // half stays: without it the toolbar collides with the title rule.
  flushBody: {
    scrollbarGutter: 'auto',
    paddingInline: 0,
    paddingBlockEnd: 0,
  },
});
