import * as stylex from '@stylexjs/stylex';
import { useLoaderData, useSearchParams } from 'react-router';

import type {
  InfiniteScrollConfig,
  OffsetLimitParams,
  OnSortChangeArgs,
} from '@/components/Table';
import type { CarSale } from '@/services';

import { Table } from '@/components/Table';
import { TableSuspenseBoundary } from '@/components/Table/TableSuspenseBoundary/TableSuspenseBoundary.component';
import { carSalesApi } from '@/services';

import type { loader } from './car-sales.loader';
import type { CarSalesTableProps } from './CarSales.types';

import { columns } from './CarSales.constants';
import { styles } from './CarSales.stylex';

export const CarSales = () => {
  const {
    carSalesPromise,
    columnOrder,
    columnSizing,
    columnVisibility,
    sorting,
  } = useLoaderData<typeof loader>();

  return (
    <div {...stylex.props(styles.container)}>
      <TableSuspenseBoundary<
        CarSale,
        { data: CarSale[]; hasMore: boolean; total: number }
      >
        columns={columns}
        columnSizing={columnSizing}
        dataPromise={carSalesPromise}
        dataSelector={(response) => response.data}
        initialColumnOrder={columnOrder}
        initialColumnVisibility={columnVisibility}
        title='Car Sales Data - Infinite Scroll'
      >
        {(data) => (
          <CarSalesTable
            columnOrder={columnOrder}
            columnSizing={columnSizing}
            columnVisibility={columnVisibility}
            initialData={data}
            sorting={sorting}
          />
        )}
      </TableSuspenseBoundary>
    </div>
  );
};

const CarSalesTable = ({
  columnOrder,
  columnSizing,
  columnVisibility,
  initialData,
  sorting: currentSorting,
}: CarSalesTableProps) => {
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

  const infiniteScrollConfig: InfiniteScrollConfig<CarSale> = {
    initialPageSize: 50,
    isEnabled: true,
    loadMorePageSize: 50,
    onLoadMore: async (params) => {
      const { limit, skip } = params as OffsetLimitParams;
      // Include current sorting when loading more data
      const response = await carSalesApi.fetchCarSalesPaginated(
        skip,
        limit,
        currentSorting,
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

  // Use sorting as key to force Table remount when sorting changes
  const sortKey = currentSorting ? JSON.stringify(currentSorting) : 'default';

  return (
    <Table
      columns={columns}
      columnSizing={columnSizing}
      data={initialData}
      density='comfortable'
      infiniteScrollConfig={infiniteScrollConfig}
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
      key={sortKey}
      onSortChange={handleSortChange}
      persistenceKey='car-sales-infinite-table'
      title='Car Sales Data - Infinite Scroll'
    />
  );
};
