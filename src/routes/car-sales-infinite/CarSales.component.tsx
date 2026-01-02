import * as stylex from '@stylexjs/stylex';
import { useRef, useState } from 'react';
import { useLoaderData } from 'react-router';

import type { InfiniteScrollConfig, OffsetLimitParams } from '@/components/Table';
import type { CarSale } from '@/services';

import { Table, TableSuspenseBoundary } from '@/components/Table';
import { carSalesApi } from '@/services';

import type { loader } from './car-sales.loader';

import { columns } from './CarSales.constants';
import { styles } from './CarSales.stylex';

export const CarSales = () => {
  const { carSalesPromise } = useLoaderData<typeof loader>();
  const [totalCount, setTotalCount] = useState<number | undefined>();
  const initialMetaRef = useRef<null | {
    dataLength: number;
    hasMore: boolean;
    total: number;
  }>(null);

  const infiniteScrollConfig: InfiniteScrollConfig<CarSale> = {
    initialPageSize: 50,
    isEnabled: true,
    loadMorePageSize: 50,
    onLoadMore: async (params) => {
      const { limit, skip } = params as OffsetLimitParams;
      const response = await carSalesApi.fetchCarSalesPaginated(skip, limit);

      // Update total count
      setTotalCount(response.total);

      return {
        data: response.data,
        hasMore: response.hasMore,
        totalRows: response.total,
      };
    },
    strategy: 'offset-limit',
    threshold: 200,
  };

  return (
    <div {...stylex.props(styles.container)}>
      <div {...stylex.props(styles.header)}>
        <h1>Car Sales Data - Infinite Scroll</h1>
        {totalCount !== undefined && (
          <p>Total records: {totalCount.toLocaleString()}</p>
        )}
      </div>

      <TableSuspenseBoundary<CarSale, { data: CarSale[]; hasMore: boolean; total: number }>
        columns={columns}
        dataPromise={carSalesPromise}
        dataSelector={(response) => {
          // Store metadata in ref for initializing Table
          initialMetaRef.current = {
            dataLength: response.data.length,
            hasMore: response.hasMore,
            total: response.total,
          };
          // Update total count
          queueMicrotask(() => {
            setTotalCount(response.total);
          });
          return response.data;
        }}
        persistenceKey='car-sales-infinite-table'
      >
        {(data) => (
          <Table
            columns={columns}
            data={data}
            density='comfortable'
            infiniteScrollConfig={infiniteScrollConfig}
            initialMeta={
              initialMetaRef.current
                ? {
                    hasMore: initialMetaRef.current.hasMore,
                    paginationMeta: { offset: initialMetaRef.current.dataLength },
                    totalRows: initialMetaRef.current.total,
                  }
                : undefined
            }
            isBordered
            isStriped
            persistenceKey='car-sales-infinite-table'
          />
        )}
      </TableSuspenseBoundary>
    </div>
  );
};
