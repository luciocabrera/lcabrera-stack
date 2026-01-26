import { useLoaderData } from 'react-router';

import type { EnterpriseOrder } from '@/services';

import {
  INFINITE_SCROLL_THRESHOLD,
  INITIAL_PAGE_SIZE,
  LOAD_MORE_PAGE_SIZE,
  STRATEGY,
} from '@/components/Table/Table.constants';
import { TableLayout } from '@/layouts/TableLayout';
import { enterpriseOrdersApi } from '@/services';

import type { loader } from './enterprise-orders.loader';

import { COLUMNS, PERSISTENCE_KEY } from './EnterpriseOrders.constants';

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
    <TableLayout<EnterpriseOrder>
      columnOrder={columnOrder}
      columns={COLUMNS}
      columnSizing={columnSizing}
      columnVisibility={columnVisibility}
      dataPromise={enterpriseOrdersPromise}
      dataSelector={(response) =>
        (response as { data: EnterpriseOrder[] }).data
      }
      filters={filters}
      infiniteScrollConfig={{
        initialPageSize: INITIAL_PAGE_SIZE,
        isEnabled: true,
        loadMorePageSize: LOAD_MORE_PAGE_SIZE,
        onLoadMore: async ({ limit, skip }) => {
          const response =
            await enterpriseOrdersApi.fetchEnterpriseOrdersPaginated({
              filter: filters,
              limit,
              skip,
              sorting,
            });
            console.log('EnterpriseOrders - onLoadMore :', { hasMore: response.hasMore, limit, response,             skip,
            total: response.total, });

          return {
            data: response.data,
            hasMore: response.hasMore,
            total: response.total,
          };
        },
        strategy: STRATEGY,
        threshold: INFINITE_SCROLL_THRESHOLD,
      }}
      persistenceKey={PERSISTENCE_KEY}
      sorting={sorting}
      title='Enterprise Orders - Infinite Scroll'
    />
  );
};
