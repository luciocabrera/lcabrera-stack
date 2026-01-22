import { useLoaderData } from 'react-router';

import type { EnterpriseOrder } from '@/services';

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

  console.log('EnterpriseOrders rendered:', {
    columnOrder,
    columnSizing,
    columnVisibility,
    filters,
    sorting,
  });

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
        onLoadMore: async ({ filters, limit, skip, sorting }) => {
          const response =
            await enterpriseOrdersApi.fetchEnterpriseOrdersPaginated({
              filter: filters,
              limit,
              skip,
              sorting,
            });

          return {
            data: response.data,
            hasMore: response.hasMore,
            total: response.total,
          };
        },
      }}
      persistenceKey={PERSISTENCE_KEY}
      sorting={sorting}
      title='Enterprise Orders - Infinite Scroll'
    />
  );
};
