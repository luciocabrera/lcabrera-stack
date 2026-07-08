type RenderTableBodyColumnGroupArgs<TData, TColumn, TResult> = {
  readonly columns: readonly TColumn[];
  readonly renderCell: (args: {
    readonly col: TColumn;
    readonly row: TData;
  }) => TResult;
  readonly row: TData;
};

/**
 * Maps a column group to rendered cell results using shared row data.
 */
export const renderTableBodyColumnGroup = <TData, TColumn, TResult>({
  columns,
  renderCell,
  row,
}: RenderTableBodyColumnGroupArgs<TData, TColumn, TResult>) =>
  columns.map((col) => renderCell({ col, row }));
