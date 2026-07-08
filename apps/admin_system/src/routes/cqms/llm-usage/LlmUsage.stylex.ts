import * as stylex from '@stylexjs/stylex';

// TableLayout sets height: 100% internally (row virtualization needs a
// definite height to measure against) — a plain stacked <div> gives it
// none, so each table on this page needs its own explicit height.
export const styles = stylex.create({
  tableWrapper: {
    height: 400,
  },
});
