import { Table } from '#ui/components/Table';
import {
  FiltersDataProvider,
  TableConfigProvider,
  TableFocusProvider,
} from '#ui/components/Table/contexts';
import { createEmptyColumnsState } from '#ui/components/Table/utils/createEmptyColumnsState.util';

import type { StaticTableProps } from './StaticTable.types';

export const StaticTable = <TData extends Record<string, unknown>>({
  actions,
  columns,
  rows,
  title,
}: StaticTableProps<TData>) => (
  <TableConfigProvider<TData>
    columnsState={createEmptyColumnsState({ columns })}
    metaState={
      title
        ? {
            title: {
              plural: title,
              singular: 'Row',
            },
          }
        : {}
    }
  >
    <TableFocusProvider>
      <FiltersDataProvider<TData> columns={[...columns]}>
        <Table<TData, readonly TData[]>
          actions={actions}
          dataSelector={(r) => r}
          response={rows}
        />
      </FiltersDataProvider>
    </TableFocusProvider>
  </TableConfigProvider>
);
