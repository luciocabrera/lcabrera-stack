import type { TableColumn } from '#ui/components/Table/Table.types';

import { detectDataType } from '#ui/components/Table/TableBodyCell/utils/detectDataType.util';
import { renderCellContent } from '#ui/components/Table/TableBodyCell/utils/renderCellContent.util';

import type { TableCellCallBinding } from './cellRenderers.types';

type RenderTableCellCallArgs<TData> = {
  readonly cellCall: TableCellCallBinding | undefined;
  readonly col: TableColumn<TData>;
  readonly isLoadingState: boolean;
  readonly row: TData;
  readonly value: unknown;
};

export const renderTableCellCall = <TData>({
  cellCall,
  col,
  isLoadingState,
  row,
  value,
}: RenderTableCellCallArgs<TData>) => {
  if (isLoadingState || cellCall?.outcome?.status !== 'resolved') return;

  const { outcome, tone } = cellCall;

  const formatted = renderCellContent({
    dataType: col.dataType ?? detectDataType(value),
    format: col.format,
    label: col.label,
    value,
  });

  return {
    content: outcome.renderer.render({
      formatted,
      params: outcome.params,
      row,
      tone,
      value,
    }),
  };
};
