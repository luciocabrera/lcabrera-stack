type RenderTableBodyPinnedGroupArgs<TData, TColumn, TResult> = {
  readonly columns: readonly TColumn[];
  readonly renderCell: (args: {
    readonly col: TColumn;
    readonly row: TData;
    readonly rowIndex: number;
    readonly rowKey: string;
  }) => TResult;
  readonly row: TData;
  readonly rowIndex: number;
  readonly rowKey: string;
};

/**
 * Maps a column group to rendered cell results using shared row data.
 *
 * The row's identity and absolute index travel with the row itself rather than
 * being bound into the renderer, because they change per row while sizing and
 * pinning do not.
 */
export const renderTableBodyPinnedGroup = <TData, TColumn, TResult>({
  columns,
  renderCell,
  row,
  rowIndex,
  rowKey,
}: RenderTableBodyPinnedGroupArgs<TData, TColumn, TResult>) =>
  columns.map((col) => renderCell({ col, row, rowIndex, rowKey }));
