import type {
  ColumnSizingState,
  DataKey,
  PinnedColumnInfo,
  TableColumn,
} from '#ui/components/Table/Table.types';

import { buildTableBodyCellDescriptor } from './buildTableBodyCellDescriptor.util';
import { renderFromDescriptor } from './renderFromDescriptor.util';

type CreateRenderTableBodyCellArgs<TData extends Record<string, unknown>> = {
  readonly columnSizing: ColumnSizingState<TData>;
  readonly isLoadingState: boolean;
  readonly pinnedOffsets: Partial<Record<DataKey<TData>, PinnedColumnInfo>>;
};

type RenderBodyCellArgs<TData extends Record<string, unknown>> = {
  readonly col: TableColumn<TData>;
  readonly row: TData;
  readonly rowIndex: number;
  readonly rowKey: string;
};

/**
 * Creates a stable row-cell renderer bound to current sizing and pin offsets.
 *
 * Sizing and pinning bind once for the whole window; the row's identity and its
 * absolute index arrive per call, because those are what address a cell in the
 * grid's focus model (ADR-062).
 */
export const createRenderTableBodyCell =
  <TData extends Record<string, unknown>>({
    columnSizing,
    isLoadingState,
    pinnedOffsets,
  }: CreateRenderTableBodyCellArgs<TData>) =>
  ({ col, row, rowIndex, rowKey }: RenderBodyCellArgs<TData>) => {
    const descriptor = buildTableBodyCellDescriptor({
      col,
      columnSizing,
      isLoadingState,
      pinnedOffsets,
      row,
      rowIndex,
      rowKey,
    });

    return renderFromDescriptor({ descriptor });
  };
