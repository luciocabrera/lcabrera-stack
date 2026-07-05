import { Table } from '@repo/ui/components/Table';
import {
  FiltersDataProvider,
  TableConfigProvider,
} from '@repo/ui/components/Table/contexts';
import { createEmptyColumnsState } from '@repo/ui/components/Table/utils/createEmptyColumnsState.util';

import type { StaticTableProps } from './StaticTable.types';

/**
 * Wires an already-resolved, non-paginated row array into the real `Table`
 * sort/filter/pin machinery — the same `TableConfigProvider` +
 * `FiltersDataProvider` composition `TableLayout` uses, minus
 * `TableSuspenseBoundary`/`dataPromise`: there is no server round-trip left
 * to stream once a loader has already awaited its data, so there's nothing
 * to suspend on. Use this instead of `TableLayout` whenever a loader
 * fetches its full row set directly (no separate paginated API to call).
 */
export const StaticTable = <TData extends Record<string, unknown>>({
  actions,
  columns,
  rows,
  title,
}: StaticTableProps<TData>) => (
  <TableConfigProvider<TData>
    columnsState={createEmptyColumnsState({ columns })}
    metaState={title ? { title } : {}}
  >
    <FiltersDataProvider<TData> columns={[...columns]}>
      <Table<TData, readonly TData[]>
        actions={actions}
        dataSelector={(r) => r}
        response={rows}
      />
    </FiltersDataProvider>
  </TableConfigProvider>
);
