type ScrollRowIntoViewArgs = {
  readonly container: HTMLElement | null | undefined;
  readonly rowHeight: number;
  readonly rowIndex: number;
};

/**
 * Scrolls the virtualization container so the row at `rowIndex` is inside it.
 *
 * A row's offset is computed from `rowIndex × rowHeight` rather than measured
 * off a node, because the node is exactly what does not exist when this is
 * needed: a focus move whose target lies outside the rendered window has to
 * scroll first and focus after (ADR-062). It is the same arithmetic
 * `getVerticalVirtualizationWindow` derives the window from, so the row this
 * scrolls to is the row that then mounts.
 *
 * Already-visible rows are left alone, so a move within the window never jerks
 * the viewport.
 */
export const scrollRowIntoView = ({
  container,
  rowHeight,
  rowIndex,
}: ScrollRowIntoViewArgs) => {
  if (!container || rowHeight <= 0) return;

  const rowTop = rowIndex * rowHeight;
  const viewTop = container.scrollTop;

  if (rowTop < viewTop) {
    container.scrollTop = rowTop;

    return;
  }

  const rowBottom = rowTop + rowHeight;
  const viewBottom = viewTop + container.clientHeight;

  if (rowBottom > viewBottom) {
    container.scrollTop = rowBottom - container.clientHeight;
  }
};
