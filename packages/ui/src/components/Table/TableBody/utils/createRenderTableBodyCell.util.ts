import type {
  ColumnSizingState,
  DataKey,
  PinnedColumnInfo,
  TableColumn,
  TableGroupRowSummary,
} from '#ui/components/Table/Table.types';

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
  readonly col: TableColumn<TData>;
  /** The row's group summary, when it has one — per row, like the row itself. */
  readonly groupSummary?: TableGroupRowSummary;
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
  ({ col, groupSummary, row, rowIndex, rowKey }: RenderBodyCellArgs<TData>) => {
    const descriptor = buildTableBodyCellDescriptor({
      col,
      columnSizing,
      groupingKeys,
      groupSummary,
      isLoadingState,
      pinnedOffsets,
      row,
      rowIndex,
      rowKey,
    });

    return renderFromDescriptor({ descriptor });
  };
