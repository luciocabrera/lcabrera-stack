type GetGridPageRowsArgs = {
  readonly container: HTMLElement | null | undefined;
  readonly rowHeight: number;
};

export const getGridPageRows = ({
  container,
  rowHeight,
}: GetGridPageRowsArgs) => {
  return !container || rowHeight <= 0
    ? 1
    : Math.max(Math.floor(container.clientHeight / rowHeight), 1);
};
