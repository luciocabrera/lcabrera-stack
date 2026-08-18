import type { TableGroupRowSummary } from '#ui/components/Table/Table.types';
import type { TableGroupDisclosureState } from '#ui/components/Table/TableGroupDisclosure';

type RenderTableBodyPinnedGroupArgs<TData, TColumn, TResult> = {
  readonly columns: readonly TColumn[];
  readonly disclosure?: TableGroupDisclosureState;
  readonly groupSummary?: TableGroupRowSummary;
  readonly renderCell: (args: {
    readonly col: TColumn;
    readonly disclosure?: TableGroupDisclosureState;
    readonly groupSummary?: TableGroupRowSummary;
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
 * The row's identity, its absolute index and its group summary travel with the
 * row itself rather than being bound into the renderer, because all three
 * change per row while sizing and pinning do not.
 */
export const renderTableBodyPinnedGroup = <TData, TColumn, TResult>({
  columns,
  disclosure,
  groupSummary,
  renderCell,
  row,
  rowIndex,
  rowKey,
}: RenderTableBodyPinnedGroupArgs<TData, TColumn, TResult>) =>
  columns.map((col) =>
    renderCell({ col, disclosure, groupSummary, row, rowIndex, rowKey }),
  );
