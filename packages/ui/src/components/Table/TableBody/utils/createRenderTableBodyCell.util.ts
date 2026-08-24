import type {
  ColumnSizingState,
  DataKey,
  PinnedColumnInfo,
  TableColumn,
  TableGroupRowSummary,
} from '#ui/components/Table/Table.types';
import type { TableGroupDisclosureState } from '#ui/components/Table/TableGroupDisclosure';

import { buildTableBodyCellDescriptor } from './buildTableBodyCellDescriptor.util';
import { renderFromDescriptor } from './renderFromDescriptor.util';

type CreateRenderTableBodyCellArgs<TData extends Record<string, unknown>> = {
  readonly columnSizing: ColumnSizingState<TData>;
  /**
   * Bound once for the whole window because it is configuration: a detail row consults it to
   * know which of its columns the group row above it already states (ADR-065).
   */
  readonly groupingKeys: readonly string[];
  readonly isLoadingState: boolean;
  readonly pinnedOffsets: Partial<Record<DataKey<TData>, PinnedColumnInfo>>;
};

type RenderBodyCellArgs<TData extends Record<string, unknown>> = {
  readonly carriedGroupKeys: ReadonlySet<string>;
  readonly col: TableColumn<TData>;
  readonly disclosure?: TableGroupDisclosureState;
  readonly groupSummary?: TableGroupRowSummary;
  readonly hasStructuralMarker: boolean;
  readonly row: TData;
  readonly rowIndex: number;
  readonly rowKey: string;
};

/** Creates a stable row-cell renderer bound to current sizing, pin offsets and grouping. */
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
