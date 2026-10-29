import type { TableGridContentProps } from './TableGrid.types';

import { useTableDataState } from '../hooks/useTableDataState.hook';
import { TableGridContent } from './TableGridContent.component';

export const TableGridLocalRows = <
  TData extends Record<string, unknown>,
  TResponse,
>({
  dataState,
  ...props
}: TableGridContentProps<TData, TResponse>) => (
  <TableGridContent<TData, TResponse>
    {...props}
    dataState={{ ...dataState, ...useTableDataState(dataState) }}
  />
);
