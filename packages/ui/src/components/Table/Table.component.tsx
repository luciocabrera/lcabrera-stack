import { Suspense, use } from 'react';

import type { TableProps } from './Table.types';

import { TableConfigContext } from './contexts/TableConfig/TableConfigContext.context';
import { TableOwnStackContext } from './contexts/TableConfig/TableOwnStackContext.context';
import { INITIAL_PAGE_SIZE } from './Table.constants';
import { generatePlaceholderData } from './TableBody/utils';
import { TableDataResolver } from './TableDataResolver';
import { TableGrid } from './TableGrid.component';
import { TableOwnStack } from './TableOwnStack.component';
import { needsOwnTableStack } from './utils/needsOwnTableStack.util';

export const Table = <TData extends Record<string, unknown>, TResponse>(
  props: TableProps<TData, TResponse>,
) => {
  const { columns, dataSelector, response, title } = props;
  const isNeedsOwnStack = needsOwnTableStack({
    hasConfig: use(TableConfigContext) !== undefined,
    isInOwnStack: use(TableOwnStackContext),
    isRowsResponse: dataSelector === undefined,
  });

  if (isNeedsOwnStack) {
    return (
      <TableOwnStack<TData> columns={columns} title={title}>
        <Table<TData, TResponse> {...props} />
      </TableOwnStack>
    );
  }

  if (response instanceof Promise) {
    return (
      <Suspense
        fallback={
          <Table<TData, TResponse>
            {...props}
            dataSelector={undefined}
            isLoading
            onLoadMore={undefined}
            response={generatePlaceholderData<TData>({
              columns,
              rowCount: INITIAL_PAGE_SIZE,
            })}
          />
        }
      >
        <TableDataResolver<readonly TData[] | TResponse> dataPromise={response}>
          {(resolved) => (
            <Table<TData, TResponse> {...props} response={resolved} />
          )}
        </TableDataResolver>
      </Suspense>
    );
  }

  return <TableGrid<TData, TResponse> {...props} />;
};
