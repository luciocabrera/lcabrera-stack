type RenderTableBodyPinnedGroupArgs<TData, TColumn, TResult> = {
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
export const renderTableBodyPinnedGroup = <TData, TColumn, TResult>({
  columns,
  renderCell,
  row,
}: RenderTableBodyPinnedGroupArgs<TData, TColumn, TResult>) =>
  columns.map((col) => renderCell({ col, row }));
