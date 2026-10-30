import { createElement } from 'react';

import { TableBodyCell } from '#ui/components/Table/TableBodyCell';

import type { TableBodyCellDescriptor } from './buildTableBodyCellDescriptor.util';

type RenderFromDescriptorArgs<TData extends Record<string, unknown>> = {
  readonly descriptor: TableBodyCellDescriptor<TData>;
};

export const renderFromDescriptor = <TData extends Record<string, unknown>>({
  descriptor,
}: RenderFromDescriptorArgs<TData>) => {
  if (descriptor.kind === 'custom') {
    return createElement(
      TableBodyCell,
      {
        align: descriptor.align,
        columnKey: descriptor.columnKey,
        dataType: descriptor.dataType,
        isFill: descriptor.isFill,
        isLoadingState: descriptor.isLoadingState,
        key: descriptor.key,
        label: descriptor.label,
        minWidth: descriptor.minWidth,
        pinInfo: descriptor.pinInfo,
        rowIndex: descriptor.rowIndex,
        rowKey: descriptor.rowKey,
        staticWidths: descriptor.staticWidths,
        width: descriptor.width,
      },
      descriptor.children,
    );
  }

  return createElement(TableBodyCell, {
    align: descriptor.align,
    columnKey: descriptor.columnKey,
    dataType: descriptor.dataType,
    format: descriptor.format,
    isFill: descriptor.isFill,
    isLoadingState: descriptor.isLoadingState,
    key: descriptor.key,
    label: descriptor.label,
    minWidth: descriptor.minWidth,
    pinInfo: descriptor.pinInfo,
    rowIndex: descriptor.rowIndex,
    rowKey: descriptor.rowKey,
    staticWidths: descriptor.staticWidths,
    value: descriptor.value,
    width: descriptor.width,
  });
};
