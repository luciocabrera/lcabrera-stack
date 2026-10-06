import type { ReactNode } from 'react';

import type { TableCellCallBinding } from '#ui/components/Table/cellRenderers/cellRenderers.types';
import type { TableColumn } from '#ui/components/Table/Table.types';

import { renderTableCellCall } from '#ui/components/Table/cellRenderers/renderTableCellCall.util';

type ResolveOwnCellChildrenArgs<TData> = {
  readonly cellCall: TableCellCallBinding | undefined;
  readonly col: TableColumn<TData>;
  readonly customActions: ReactNode;
  readonly isLoadingState: boolean;
  readonly row: TData;
  readonly value: unknown;
};

export const resolveOwnCellChildren = <TData>({
  cellCall,
  col,
  customActions,
  isLoadingState,
  row,
  value,
}: ResolveOwnCellChildrenArgs<TData>) => {
  if (customActions) return { children: customActions, dataType: undefined };

  const called = renderTableCellCall({
    cellCall,
    col,
    isLoadingState,
    row,
    value,
  });

  return called && { children: called.content, dataType: col.dataType };
};
