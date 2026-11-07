type GetCellKeyArgs = {
  readonly column: string;
  readonly row: string;
};

export const getCellKey = ({ column, row }: GetCellKeyArgs) =>
  `${encodeURIComponent(row)}/${encodeURIComponent(column)}`;
