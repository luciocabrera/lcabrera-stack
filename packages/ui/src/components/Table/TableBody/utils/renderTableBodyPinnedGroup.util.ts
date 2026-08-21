import type {
  TableDrillRowMarker,
  TableGroupRowSummary,
} from '#ui/components/Table/Table.types';
import type { TableGroupDisclosureState } from '#ui/components/Table/TableGroupDisclosure';

type RenderTableBodyPinnedGroupArgs<TData, TColumn, TResult> = {
  readonly carriedGroupKeys: ReadonlySet<string>;
  readonly columns: readonly TColumn[];
  readonly disclosure?: TableGroupDisclosureState;
  readonly drillRow?: TableDrillRowMarker;
  readonly groupSummary?: TableGroupRowSummary;
  readonly hasStructuralMarker: boolean;
  readonly renderCell: (args: {
    readonly carriedGroupKeys: ReadonlySet<string>;
    readonly col: TColumn;
    readonly disclosure?: TableGroupDisclosureState;
    readonly drillRow?: TableDrillRowMarker;
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
 * Maps a column group to rendered cell results using shared row data.
 *
 * The row's identity, its absolute index and everything describing what kind of
 * row it is travel with the row itself rather than being bound into the
 * renderer, because all of them change per row while sizing and pinning do not.
 *
 * **Every per-row field must be named here explicitly.** The caller spreads one
 * `cellArgs` object into this function, so a field this signature does not
 * destructure is dropped silently rather than rejected — excess properties
 * survive a spread. That is how `drillRow` went missing: the marker was built
 * per row and never reached the cell descriptor, so every drill chrome row was
 * read as an ordinary data row and the actions column asked it for a primary
 * key it does not have, emptying the table on the first click of a chevron.
 */
export const renderTableBodyPinnedGroup = <TData, TColumn, TResult>({
  carriedGroupKeys,
  columns,
  disclosure,
  drillRow,
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
      drillRow,
      groupSummary,
      hasStructuralMarker,
      row,
      rowIndex,
      rowKey,
    }),
  );
