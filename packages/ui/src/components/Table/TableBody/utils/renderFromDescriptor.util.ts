import { TableBodyCell } from '@lcabrera/ui/components/Table/TableBodyCell';
import { createElement } from 'react';

import type { TableBodyCellDescriptor } from './buildTableBodyCellDescriptor.util';

type RenderFromDescriptorArgs<TData extends Record<string, unknown>> = {
  readonly descriptor: TableBodyCellDescriptor<TData>;
};

/**
 * Renders a `TableBodyCell` from an already-built descriptor.
 *
 * The split from `buildTableBodyCellDescriptor` is what keeps the cell's
 * decision-making testable without React: that util decides *what* a cell is
 * from the column and row, and this one only turns the result into an element.
 * Neither reads the other's inputs.
 *
 * `createElement` rather than JSX so this stays a `.ts` file — the two calls
 * pass whole descriptors through and gain nothing from JSX syntax.
 */
export const renderFromDescriptor = <TData extends Record<string, unknown>>({
  descriptor,
}: RenderFromDescriptorArgs<TData>) => {
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
