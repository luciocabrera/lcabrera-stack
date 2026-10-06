import type { TableCellCallOutcome } from '#ui/components/Table/cellRenderers/cellRenderers.types';
import type {
  ColumnSizingState,
  DataKey,
  PinnedColumnInfo,
  TableCellToneColors,
  TableColumn,
  TableGroupRowSummary,
} from '#ui/components/Table/Table.types';
import type { TableGroupDisclosureState } from '#ui/components/Table/TableGroupDisclosure';

import { buildTableBodyCellDescriptor } from './buildTableBodyCellDescriptor.util';
import { renderFromDescriptor } from './renderFromDescriptor.util';

type CreateRenderTableBodyCellArgs<TData extends Record<string, unknown>> = {
  readonly cellCalls: ReadonlyMap<string, TableCellCallOutcome>;
  readonly columnSizing: ColumnSizingState<TData>;
  readonly groupingKeys: readonly string[];
  readonly isLoadingState: boolean;
  readonly pinnedOffsets: Partial<Record<DataKey<TData>, PinnedColumnInfo>>;
  readonly tone: (name: string) => TableCellToneColors;
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

export const createRenderTableBodyCell =
  <TData extends Record<string, unknown>>({
    cellCalls,
    columnSizing,
    groupingKeys,
    isLoadingState,
    pinnedOffsets,
    tone,
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
      cellCall: { outcome: cellCalls.get(String(col.key)), tone },
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
