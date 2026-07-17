import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  /**
   * The routed content landmark. Sits between `AppDotted` (the scroll
   * container) and `<Outlet />`, so it must stay layout-transparent: routed
   * content previously composed directly against `AppDotted`'s column flex
   * box, and several routes (e.g. `TableLayout`) size themselves with
   * `height: 100%`. A flex item with `flex: 1 1 auto` + `minHeight: 0` in a
   * column flex parent resolves to a definite height, which is what keeps
   * those percentage heights resolving instead of collapsing to `auto`.
   */
  main: {
    flex: '1 1 auto',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },
});
