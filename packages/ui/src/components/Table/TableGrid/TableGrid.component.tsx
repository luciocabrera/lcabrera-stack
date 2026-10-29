import { use } from 'react';

import type { TableGridProps } from './TableGrid.types';

import { TablePersistenceContext } from '../contexts/TableConfig/TablePersistenceContext.context';
import { selectTableResponse } from '../utils/selectTableResponse.util';
import { TableGridContent } from './TableGridContent.component';
import { TableGridLocalRows } from './TableGridLocalRows.component';

export const TableGrid = <TData extends Record<string, unknown>, TResponse>(
  props: TableGridProps<TData, TResponse>,
) => {
  const { isLoading = false } = props;
  const isHeldInMemory = use(TablePersistenceContext) === undefined;
  const dataState = { ...selectTableResponse(props), isLoading };

  return isHeldInMemory && !isLoading ? (
    <TableGridLocalRows<TData, TResponse> {...props} dataState={dataState} />
  ) : (
    <TableGridContent<TData, TResponse> {...props} dataState={dataState} />
  );
};
