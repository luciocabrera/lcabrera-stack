import type {
  ColumnSizingState,
  DataKey,
  PinnedColumnInfo,
  TableColumn,
} from '@repo/ui/components/Table/Table.types';

import { TableBodyCell } from '@repo/ui/components/Table/TableBodyCell';
import { createElement } from 'react';

import {
  buildTableBodyCellDescriptor,
  type TableBodyCellDescriptor,
} from './buildTableBodyCellDescriptor.util';

type CreateRenderTableBodyCellArgs<TData extends Record<string, unknown>> = {
  readonly columnSizing: ColumnSizingState<TData>;
  readonly isLoadingState: boolean;
  readonly pinnedOffsets: Partial<Record<DataKey<TData>, PinnedColumnInfo>>;
};

type RenderBodyCellArgs<TData extends Record<string, unknown>> = {
  readonly col: TableColumn<TData>;
  readonly row: TData;
};
// TODO: sPlit in different .util
const renderFromDescriptor = <TData extends Record<string, unknown>>({
  descriptor,
}: {
  readonly descriptor: TableBodyCellDescriptor<TData>;
}) => {
  if (descriptor.kind === 'custom') {
    return createElement(
      TableBodyCell,
      {
        isLoadingState: descriptor.isLoadingState,
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
    isLoadingState: descriptor.isLoadingState,
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
