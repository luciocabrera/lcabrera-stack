type GetShouldApplyCellFocusArgs = {
  readonly activeElement: Element | null | undefined;
  readonly cell: Element;
};

/**
 * Whether an outstanding focus request may actually move DOM focus onto this
 * cell.
 *
 * It may when nothing holds focus, or when the grid already does. It may not
 * when focus has moved somewhere else on the page: a focused row that scrolled
 * out of the window is unmounted and re-mounts with the request still standing,
 * so without this check, scrolling back to a row the user had left behind would
 * yank focus out of whatever they had moved on to.
 */
export const getShouldApplyCellFocus = ({
  activeElement,
  cell,
}: GetShouldApplyCellFocusArgs) => {
  if (!activeElement || activeElement === cell.ownerDocument.body) {
    return true;
  }

  // Both roles: the same element answers to `treegrid` while its rows are a
  // tree (ADR-067), and a cell has to find its grid either way.
  return (
    cell.closest('[role="grid"],[role="treegrid"]')?.contains(activeElement) ??
    false
  );
};
