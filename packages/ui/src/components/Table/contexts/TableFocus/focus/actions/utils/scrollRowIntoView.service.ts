type ScrollRowIntoViewArgs = {
  readonly container: HTMLElement | null | undefined;
  readonly rowHeight: number;
  readonly rowIndex: number;
};

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
