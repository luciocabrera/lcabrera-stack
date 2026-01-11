import * as stylex from '@stylexjs/stylex';
import { useLoaderData, useSearchParams } from 'react-router';

import type {
  InfiniteScrollConfig,
  OffsetLimitParams,
  OnFilterChangeArgs,
  OnSortChangeArgs,
} from '@/components/Table';
import type { EnterpriseOrder } from '@/services';

import { Table } from '@/components/Table';
import { TableSuspenseBoundary } from '@/components/Table/TableSuspenseBoundary/TableSuspenseBoundary.component';
import { enterpriseOrdersApi } from '@/services';

import type { loader } from './enterprise-orders.loader';
import type { EnterpriseOrdersTableProps } from './EnterpriseOrders.types';

import { columns } from './EnterpriseOrders.constants';
import { styles } from './EnterpriseOrders.stylex';

export const EnterpriseOrders = () => {
  const {
    columnOrder,
    columnSizing,
    columnVisibility,
    enterpriseOrdersPromise,
    filters,
    sorting,
  } = useLoaderData<typeof loader>();

  return (
    <div {...stylex.props(styles.container)}>
      <TableSuspenseBoundary<
        EnterpriseOrder,
        { data: EnterpriseOrder[]; hasMore: boolean; total: number }
      >
        columns={columns}
        columnSizing={columnSizing}
        dataPromise={enterpriseOrdersPromise}
        dataSelector={(response) => response.data}
        initialColumnOrder={columnOrder}
        initialColumnVisibility={columnVisibility}
        title='Enterprise Orders - Infinite Scroll'
      >
        {(data) => (
          <EnterpriseOrdersTable
            columnOrder={columnOrder}
            columnSizing={columnSizing}
            columnVisibility={columnVisibility}
            filters={filters}
            initialData={data}
            sorting={sorting}
          />
        )}
      </TableSuspenseBoundary>
    </div>
  );
};

const EnterpriseOrdersTable = ({
  columnOrder,
  columnSizing,
  columnVisibility,
  filters: currentFilters,
  initialData,
  sorting: currentSorting,
}: EnterpriseOrdersTableProps) => {
  const [, setSearchParams] = useSearchParams();

  const handleSortChange = ({ sorting }: OnSortChangeArgs) => {
    // Type guard to ensure sorting is properly typed
    if (!Array.isArray(sorting)) return Promise.resolve();

    // Update URL params to trigger loader re-fetch
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
    // Update URL params to trigger loader re-fetch
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

  const infiniteScrollConfig: InfiniteScrollConfig<EnterpriseOrder> = {
    initialPageSize: 50,
    isEnabled: true,
    loadMorePageSize: 50,
    onLoadMore: async (params) => {
      const { limit, skip } = params as OffsetLimitParams;
      // Include current sorting and filters when loading more data
      const response = await enterpriseOrdersApi.fetchEnterpriseOrdersPaginated(
        {
          filter: currentFilters,
          limit,
          skip,
          sorting: currentSorting,
        },
      );

      return {
        data: response.data,
        hasMore: response.hasMore,
        totalRows: response.total,
      };
    },
    strategy: 'offset-limit',
    threshold: 200,
  };

  // Use sorting and filters as key to force Table remount when they change
  const sortKey = currentSorting ? JSON.stringify(currentSorting) : 'default';
  const filterKey = currentFilters ? JSON.stringify(currentFilters) : 'default';
  const tableKey = `${sortKey}-${filterKey}`;

  return (
    <Table
      columns={columns}
      columnSizing={columnSizing}
      data={initialData}
      density='comfortable'
      infiniteScrollConfig={infiniteScrollConfig}
      initialColumnFilters={currentFilters ?? {}}
      initialColumnOrder={columnOrder}
      initialColumnVisibility={columnVisibility}
      initialMeta={{
        hasMore: true,
        paginationMeta: {
          offset: initialData.length,
        },
      }}
      initialSorting={currentSorting ?? []}
      isBordered
      isStriped
      key={tableKey}
      onFilterChange={handleFilterChange}
      onSortChange={handleSortChange}
      persistenceKey='enterprise-orders-table'
      title='Enterprise Orders - Infinite Scroll'
    />
  );
};
