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

/**
 * **Every per-row field must be named here explicitly.** The caller spreads one `cellArgs`
 * object into this function, so a field this signature does not destructure is dropped
 * silently rather than rejected — excess properties survive a spread.
 * That is how the structural marker went missing (#887): it was built per row and never
 * reached the cell descriptor, so every structural row was read as an ordinary data row
 * and the actions column asked it for a primary key it does not have, emptying the table
 * on the first click of a chevron.
 */
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
