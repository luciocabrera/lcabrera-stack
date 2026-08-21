import type {
  ColumnSizingState,
  DataKey,
  PinnedColumnInfo,
  TableColumn,
  TableDrillRowMarker,
  TableGroupRowSummary,
} from '#ui/components/Table/Table.types';
import type { TableGroupDisclosureState } from '#ui/components/Table/TableGroupDisclosure';

import { buildTableBodyCellDescriptor } from './buildTableBodyCellDescriptor.util';
import { renderFromDescriptor } from './renderFromDescriptor.util';

type CreateRenderTableBodyCellArgs<TData extends Record<string, unknown>> = {
  readonly columnSizing: ColumnSizingState<TData>;
  /**
   * The applied group keys. Bound once for the whole window because it is
   * configuration: a detail row consults it to know which of its columns the
   * group row above it already states (ADR-065).
   */
  readonly groupingKeys: readonly string[];
  readonly isLoadingState: boolean;
  readonly pinnedOffsets: Partial<Record<DataKey<TData>, PinnedColumnInfo>>;
};

type RenderBodyCellArgs<TData extends Record<string, unknown>> = {
  /**
   * Which key columns this row carries from the row above — per row, like the
   * summary, because it is a statement about this row's neighbours.
   */
  readonly carriedGroupKeys: ReadonlySet<string>;
  readonly col: TableColumn<TData>;
  /** The row's place in the tree, when it is a group row — per row, like the summary. */
  readonly disclosure?: TableGroupDisclosureState;
  /** The row's drill marker, when it is grid chrome — per row, like the summary. */
  readonly drillRow?: TableDrillRowMarker;
  /** The row's group summary, when it has one — per row, like the row itself. */
  readonly groupSummary?: TableGroupRowSummary;
  /**
   * Whether the row claims to be chrome — see `hasTableStructuralMarker`.
   * Required for the reason `buildTableBodyCellDescriptor` states.
   */
  readonly hasStructuralMarker: boolean;
  readonly row: TData;
  readonly rowIndex: number;
  readonly rowKey: string;
};

/**
 * Creates a stable row-cell renderer bound to current sizing, pin offsets and
 * grouping.
 *
 * Sizing, pinning and the group keys bind once for the whole window; the row's
 * identity, its absolute index and whether it is a group arrive per call,
 * because those are what address and describe one row.
 */
export const createRenderTableBodyCell =
  <TData extends Record<string, unknown>>({
    columnSizing,
    groupingKeys,
    isLoadingState,
    pinnedOffsets,
  }: CreateRenderTableBodyCellArgs<TData>) =>
  ({
    carriedGroupKeys,
    col,
    disclosure,
    drillRow,
    groupSummary,
    hasStructuralMarker,
    row,
    rowIndex,
    rowKey,
  }: RenderBodyCellArgs<TData>) => {
    const descriptor = buildTableBodyCellDescriptor({
      carriedGroupKeys,
      col,
      columnSizing,
      disclosure,
      drillRow,
      groupingKeys,
      groupSummary,
      hasStructuralMarker,
      isLoadingState,
      pinnedOffsets,
      row,
      rowIndex,
      rowKey,
    });

    return renderFromDescriptor({ descriptor });
  };
