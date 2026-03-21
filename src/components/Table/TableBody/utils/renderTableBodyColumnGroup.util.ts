type RenderTableBodyColumnGroupArgs<TColumn, TResult> = {
  readonly columns: readonly TColumn[];
  readonly renderCell: (args: {
    readonly col: TColumn;
    readonly rowData: Record<string, unknown>;
  }) => TResult;
  readonly rowData: Record<string, unknown>;
};

/**
 * Maps a column group to rendered cell results using shared row data.
 */
export const renderTableBodyColumnGroup = <TColumn, TResult>({
  columns,
  renderCell,
  rowData,
}: RenderTableBodyColumnGroupArgs<TColumn, TResult>): TResult[] =>
  columns.map((col) => renderCell({ col, rowData }));
