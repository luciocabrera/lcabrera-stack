import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  // `flex: 1 1 auto` + `minHeight: 0` so a height-constrained host (Modal, a
  // drawer, a split pane) hands the form its full height; in an unconstrained
  // page the form still hugs its content and nothing scrolls.
  //
  // No `gap`: the footer's own rule and padding separate it from the fields,
  // the way SidePanelFooter does. A gap here would float that rule in dead
  // space instead of sitting it directly under the content it cuts off.
  form: {
    flex: '1 1 auto',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },
});
