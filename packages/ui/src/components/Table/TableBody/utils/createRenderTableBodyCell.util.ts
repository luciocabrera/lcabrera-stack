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
};

/**
 * Creates a stable row-cell renderer bound to current sizing and pin offsets.
 */
export const createRenderTableBodyCell =
  <TData extends Record<string, unknown>>({
    columnSizing,
    isLoadingState,
    pinnedOffsets,
  }: CreateRenderTableBodyCellArgs<TData>) =>
  ({ col, row }: RenderBodyCellArgs<TData>) => {
    const descriptor = buildTableBodyCellDescriptor({
      col,
      columnSizing,
      isLoadingState,
      pinnedOffsets,
      row,
    });

    return renderFromDescriptor({ descriptor });
  };
