/**
 * Follows the link inside the focused cell, if it holds one. Answers whether it
 * did, which is what tells the caller to `preventDefault`.
 *
 * **This is the keyboard half of a cell that acts, and it exists because the
 * grid has exactly one tab stop.** ADR-062 addresses that stop by row key plus
 * column key, so an anchor inside a cell cannot be tabbable — it would be a
 * second stop inside a cell that already owns one, and tabbing through the body
 * would alternate between the two. The anchors are therefore `tabIndex={-1}`,
 * reachable by pointer and by this: `Enter` on the cell the roving focus is
 * already on, which is the grid pattern's own answer for an actionable cell.
 *
 * It is stated over *any* link rather than over the group-details link that
 * prompted it, because the rule is a property of the focus model rather than of
 * one feature — a second linked cell would otherwise arrive keyboard-dead and
 * nothing would say why.
 *
 * The first link wins **within one cell**. A cell holding two actions has no
 * unambiguous "the" action, and picking one silently is worse than the pattern
 * not applying — so a cell that needs two should not be reached this way at all.
 */
export const activateGridCellLink = (target: EventTarget) => {
  // **A cell, and never the grid.** The key handler also fires with the grid
  // element itself as the target — `getIsGridNavigationTarget` admits it, and
  // the container holds the tab stop whenever the focused row is outside the
  // virtualization window. Searching that subtree would find the first link in
  // the whole table and follow it, so `Enter` with no cell focused would
  // navigate into some unrelated group's hand-off.
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
