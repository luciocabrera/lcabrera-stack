import * as stylex from '@stylexjs/stylex';

import { Table } from '@/components/Table';
import {
  FiltersDataProvider,
  TableConfigProvider,
} from '@/components/Table/contexts';
import { TableSuspenseBoundary } from '@/components/Table/TableSuspenseBoundary';

import type { TableLayoutProps } from './TableLayout.types';

import { styles } from './TableLayout.stylex';

export const TableLayout = <
  TData extends Record<string, unknown>,
  TResponse = Record<string, unknown>,
>({
  additionalMetadata,
  columnOrder,
  columnPinning,
  columns,
  columnSizing,
  columnVisibility,
  dataPromise,
  dataSelector,
  dataTotalSelector,
  defaultColumnPinning,
  density = 'comfortable',
  enablePrefetch,
  filters,
  isBordered = true,
  isStriped = true,
  loadMorePageSize,
  onLoadMore,
  persistenceKey,
  schemaName,
  sorting,
  tableName,
  title,
}: TableLayoutProps<TData, TResponse>) => {
  const columnsState = {
    columnFilters: filters,
    columnOrder,
    columnPinning: columnPinning ?? defaultColumnPinning,
    columns,
    columnSizing,
    columnVisibility,
    sorting,
  };

  const metaState = {
    additionalMetadata,
    density,
    enablePrefetch,
    isBordered,
    isStriped,
    loadMorePageSize,
    persistenceKey,
    schemaName,
    tableName,
    title,
  };

  const clearPersistedTableState = () => {
    if (typeof document === 'undefined') {
      return;
    }

    const storageKey = `table-state-${persistenceKey}`;
    const stateKeys = [
      `${storageKey}-columnFilters`,
      `${storageKey}-columnOrder`,
      `${storageKey}-columnPinning`,
      `${storageKey}-columnSizing`,
      `${storageKey}-columnVisibility`,
      `${storageKey}-dataState`,
      `${storageKey}-sorting`,
      `${storageKey}-uiState`,
    ];

    for (const key of stateKeys) {
      // oxlint-disable-next-line unicorn/no-document-cookie -- Needed to clear specific keys
      document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;

      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }

      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(key);
      }
    }
  };

  const handleRetry = () => {
    clearPersistedTableState();

    const currentUrl = new URL(globalThis.location.href);
    currentUrl.searchParams.delete(`${persistenceKey}-tableState`);
    currentUrl.searchParams.delete('filters');
    currentUrl.searchParams.delete('sort');

    const nextUrl = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;
    globalThis.location.assign(nextUrl);
  };

  return (
    <div {...stylex.props(styles.container)}>
      <TableConfigProvider<TData>
        columnsState={columnsState}
        metaState={metaState}
      >
        <FiltersDataProvider<TData> columns={columns}>
          <TableSuspenseBoundary<TData, TResponse>
            dataPromise={dataPromise}
            onRetry={handleRetry}
          >
            {(response) => (
              <Table<TData, TResponse>
                dataSelector={dataSelector}
                dataTotalSelector={dataTotalSelector}
                onLoadMore={onLoadMore}
                response={response}
              />
            )}
          </TableSuspenseBoundary>
        </FiltersDataProvider>
      </TableConfigProvider>
    </div>
  );
};
