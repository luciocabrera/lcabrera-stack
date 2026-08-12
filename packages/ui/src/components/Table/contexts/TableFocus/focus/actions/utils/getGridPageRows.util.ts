type GetGridPageRowsArgs = {
  readonly container: HTMLElement | null | undefined;
  readonly rowHeight: number;
};

/**
 * How many rows `PageUp`/`PageDown` move by: one viewport of the scroll
 * container, which is what "a page" means to the person looking at it.
 *
 * Never less than one, so the keys still move by a row before the container has
 * been measured — a page of zero rows would make them silently dead.
 */
export const getGridPageRows = ({
  container,
  rowHeight,
}: GetGridPageRowsArgs) => {
  if (!container || rowHeight <= 0) return 1;

  return Math.max(Math.floor(container.clientHeight / rowHeight), 1);
};
