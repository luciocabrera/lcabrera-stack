/**
 * Answers whether it did, which is what tells the caller to `preventDefault`.
 * **This is the keyboard half of a cell that acts, and it exists because the grid has
 * exactly one tab stop.** ADR-062 addresses that stop by row key plus column key, so an
 * anchor inside a cell cannot be tabbable — it would be a second stop inside a cell that
 * already owns one, and tabbing through the body would alternate between the two.
 */
export const activateGridCellLink = (target: EventTarget) => {
  if (
    !(target instanceof HTMLElement) ||
    target.getAttribute('role') !== 'gridcell'
  ) {
    return false;
  }

  const link = target.querySelector('a[href]');

  if (!(link instanceof HTMLAnchorElement)) return false;

  link.click();

  return true;
};
