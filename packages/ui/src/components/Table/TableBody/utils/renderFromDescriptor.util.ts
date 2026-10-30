import { createElement } from 'react';

import { TableBodyCell } from '#ui/components/Table/TableBodyCell';

import type { TableBodyCellDescriptor } from './buildTableBodyCellDescriptor.util';

type RenderFromDescriptorArgs<TData extends Record<string, unknown>> = {
  readonly descriptor: TableBodyCellDescriptor<TData>;
};

const toCellLayout = <TData extends Record<string, unknown>>({
  align,
  isFill,
  staticWidths,
}: TableBodyCellDescriptor<TData>) => ({ align, isFill, staticWidths });

export const renderFromDescriptor = <TData extends Record<string, unknown>>({
  descriptor,
}: RenderFromDescriptorArgs<TData>) => {
  if (descriptor.kind === 'custom') {
    return createElement(
      TableBodyCell,
      {
        cellLayout: toCellLayout(descriptor),
        columnKey: descriptor.columnKey,
        dataType: descriptor.dataType,
        isLoadingState: descriptor.isLoadingState,
        key: descriptor.key,
        label: descriptor.label,
        minWidth: descriptor.minWidth,
        pinInfo: descriptor.pinInfo,
        rowIndex: descriptor.rowIndex,
        rowKey: descriptor.rowKey,
        width: descriptor.width,
      },
      descriptor.children,
    );
  }

  return createElement(TableBodyCell, {
    cellLayout: toCellLayout(descriptor),
    columnKey: descriptor.columnKey,
    dataType: descriptor.dataType,
    format: descriptor.format,
    isLoadingState: descriptor.isLoadingState,
    key: descriptor.key,
    label: descriptor.label,
    minWidth: descriptor.minWidth,
    pinInfo: descriptor.pinInfo,
    rowIndex: descriptor.rowIndex,
    rowKey: descriptor.rowKey,
    value: descriptor.value,
    width: descriptor.width,
  });
};
