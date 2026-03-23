import { createElement } from 'react';

import { TableBodyCell } from '@/components/Table/TableBodyCell';

import type {
  ColumnSizingState,
  DataKey,
  PinnedColumnInfo,
  TableColumn,
} from '@/components/Table/Table.types';

import {
  buildTableBodyCellDescriptor,
  type TableBodyCellDescriptor,
} from './buildTableBodyCellDescriptor.util';

type CreateRenderTableBodyCellArgs<TData extends Record<string, unknown>> = {
  readonly columnSizing: ColumnSizingState<TData>;
  readonly pinnedOffsets: Partial<Record<DataKey<TData>, PinnedColumnInfo>>;
};

type RenderBodyCellArgs<TData extends Record<string, unknown>> = {
  readonly col: TableColumn<TData>;
  readonly rowData: Record<string, unknown>;
};

const renderFromDescriptor = <TData extends Record<string, unknown>>({
  descriptor,
}: {
  readonly descriptor: TableBodyCellDescriptor<TData>;
}) => {
  if (descriptor.kind === 'custom') {
    return createElement(
      TableBodyCell,
      {
        key: descriptor.key,
        label: descriptor.label,
        minWidth: descriptor.minWidth,
        pinInfo: descriptor.pinInfo,
        width: descriptor.width,
      },
      descriptor.children,
    );
  }

  return createElement(TableBodyCell, {
    dataType: descriptor.dataType,
    format: descriptor.format,
    key: descriptor.key,
    label: descriptor.label,
    minWidth: descriptor.minWidth,
    pinInfo: descriptor.pinInfo,
    value: descriptor.value,
    width: descriptor.width,
  });
};

/**
 * Creates a stable row-cell renderer bound to current sizing and pin offsets.
 */
export const createRenderTableBodyCell =
  <TData extends Record<string, unknown>>({
    columnSizing,
    pinnedOffsets,
  }: CreateRenderTableBodyCellArgs<TData>) =>
  ({ col, rowData }: RenderBodyCellArgs<TData>) => {
    const descriptor = buildTableBodyCellDescriptor({
      col,
      columnSizing,
      pinnedOffsets,
      rowData,
    });

    return renderFromDescriptor({ descriptor });
  };
