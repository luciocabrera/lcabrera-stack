type GetGridPageRowsArgs = {
  readonly container: HTMLElement | null | undefined;
  readonly rowHeight: number;
};

export const getGridPageRows = ({
  container,
  rowHeight,
}: GetGridPageRowsArgs) => {
  if (!container || rowHeight <= 0) return 1;

  return Math.max(Math.floor(container.clientHeight / rowHeight), 1);
};
