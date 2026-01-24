import { useSearchParams } from 'react-router';

import type {
  InfiniteScrollConfig,
  OffsetLimitParams,
  OnFilterChangeArgs,
  OnSortChangeArgs,
} from '@/components/Table';

import { Table } from '@/components/Table';
import {
  INFINITE_SCROLL_THRESHOLD,
  INITIAL_PAGE_SIZE,
  LOAD_MORE_PAGE_SIZE,
  STRATEGY,
} from '@/components/Table/Table.constants';

import type { TableLayoutInnerProps } from './TableLayoutInner.types';

export const TableLayoutInner = <TData extends Record<string, unknown>>({
  columnOrder,
  columns,
  columnSizing,
  columnVisibility,
  density,
  filters: currentFilters,
  infiniteScrollConfig: infiniteConfigProp,
  initialData,
  isBordered,
  isStriped,
  persistenceKey,
  sorting: currentSorting,
  title,
}: TableLayoutInnerProps<TData>) => {
  const [, setSearchParams] = useSearchParams();

  const handleSortChange = ({ sorting }: OnSortChangeArgs) => {
    if (!Array.isArray(sorting)) return Promise.resolve();

    setSearchParams((params) => {
      if (sorting.length > 0) {
        params.set('sort', JSON.stringify(sorting));
      } else {
        params.delete('sort');
      }
      return params;
    });

    return Promise.resolve();
  };

  const handleFilterChange = ({ filters }: OnFilterChangeArgs) => {
    setSearchParams((params) => {
      if (Object.keys(filters).length > 0) {
        params.set('filters', JSON.stringify(filters));
      } else {
        params.delete('filters');
      }
      return params;
    });

    return Promise.resolve();
  };

  const infiniteScrollConfig: InfiniteScrollConfig<TData> = {
    initialPageSize: INITIAL_PAGE_SIZE,
    isEnabled: true,
    loadMorePageSize: LOAD_MORE_PAGE_SIZE,
    onLoadMore: async (params) => {
      const { limit, skip } = params as OffsetLimitParams;

      // Call the provided onLoadMore with current state
      const result = await infiniteConfigProp.onLoadMore({
        filters: currentFilters,
        limit,
        skip,
        sorting: currentSorting,
      });

      return {
        data: result.data,
        hasMore: result.hasMore,
        totalRows: result.total,
      };
    },
    strategy: STRATEGY,
    threshold: INFINITE_SCROLL_THRESHOLD,
  };

  // Generate key to force Table remount when state changes
  const sortKey = currentSorting ? JSON.stringify(currentSorting) : 'default';
  const filterKey = currentFilters ? JSON.stringify(currentFilters) : 'default';
  const tableKey = `${sortKey}-${filterKey}`;

  const initialMeta = {
    hasMore: true,
    paginationMeta: {
      offset: initialData.length,
    },
  };

  return (
    <Table<TData>
      columns={columns}
      columnSizing={columnSizing}
      data={initialData}
      density={density as 'comfortable' | 'compact'}
      infiniteScrollConfig={infiniteScrollConfig}
      initialColumnFilters={currentFilters ?? {}}
      initialColumnOrder={columnOrder as string[]}
      initialColumnVisibility={columnVisibility as Set<string>}
      initialMeta={initialMeta}
      initialSorting={currentSorting ?? []}
      isBordered={isBordered}
      isStriped={isStriped}
      key={tableKey}
      onFilterChange={handleFilterChange}
      onSortChange={handleSortChange}
      persistenceKey={persistenceKey}
      title={title}
    />
  );
};
