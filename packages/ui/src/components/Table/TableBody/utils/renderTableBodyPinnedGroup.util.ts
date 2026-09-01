import type { TableGroupRowSummary } from '#ui/components/Table/Table.types';
import type { TableGroupDisclosureState } from '#ui/components/Table/TableGroupDisclosure';

type RenderTableBodyPinnedGroupArgs<TData, TColumn, TResult> = {
  readonly carriedGroupKeys: ReadonlySet<string>;
  readonly columns: readonly TColumn[];
  readonly disclosure?: TableGroupDisclosureState;
  readonly groupSummary?: TableGroupRowSummary;
  readonly hasStructuralMarker: boolean;
  readonly renderCell: (args: {
    readonly carriedGroupKeys: ReadonlySet<string>;
    readonly col: TColumn;
    readonly disclosure?: TableGroupDisclosureState;
    readonly groupSummary?: TableGroupRowSummary;
    readonly hasStructuralMarker: boolean;
    readonly row: TData;
    readonly rowIndex: number;
    readonly rowKey: string;
  }) => TResult;
  readonly row: TData;
  readonly rowIndex: number;
  readonly rowKey: string;
};

export const renderTableBodyPinnedGroup = <TData, TColumn, TResult>({
  carriedGroupKeys,
  columns,
  disclosure,
  groupSummary,
  hasStructuralMarker,
  renderCell,
  row,
  rowIndex,
  rowKey,
}: RenderTableBodyPinnedGroupArgs<TData, TColumn, TResult>) =>
  columns.map((col) =>
    renderCell({
      carriedGroupKeys,
      col,
      disclosure,
      groupSummary,
      hasStructuralMarker,
      row,
      rowIndex,
      rowKey,
    }),
  );
