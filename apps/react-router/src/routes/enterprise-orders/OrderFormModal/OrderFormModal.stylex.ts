import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  // A constant-size dialog rather than Modal's content-hugging default, so the
  // footer sits at the same place on every tab. `maxHeight` has to be restated:
  // Modal's own `min(85vh, 600px)` cap would otherwise clamp this `height`.
  dialog: {
    height: 'min(95vh, 860px)',
    maxHeight: 'min(95vh, 860px)',
    width: 'min(90vw, 900px)',
  },
  // This form's root is a Tabs node, which brings its own inline padding and
  // scrollbar gutter. Modal's default `spacing.lg` inset stacks on top of that
  // and pushes the tab strip well inside the dialog, so drop the inline half.
  // The block padding stays — without it the strip collides with the title
  // rule and the footer sits on the bottom edge.
  //
  // `scrollbarGutter: auto` for the same reason: the Form takes the body's full
  // height and scrolls inside its tab panel, so the body can never scroll and
  // its reserved gutter is inline space nothing will ever use.
  //
  // The block-end half goes too, so the Form's own bordered footer meets the
  // dialog edge like SidePanelFooter does. The block-start half stays — it is
  // what keeps the tab strip off the title rule.
  flushBody: {
    scrollbarGutter: 'auto',
    paddingInline: 0,
    paddingBlockEnd: 0,
  },
});
