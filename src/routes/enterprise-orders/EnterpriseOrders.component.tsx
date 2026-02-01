import { useLoaderData } from 'react-router';

import type { EnterpriseOrder, EnterpriseOrdersResponse } from '@/services';

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
    key,
    sorting,
  } = useLoaderData<typeof loader>();

  return (
    <TableLayout<EnterpriseOrder, EnterpriseOrdersResponse>
      columnOrder={columnOrder}
      columns={COLUMNS}
      columnSizing={columnSizing}
      columnVisibility={columnVisibility}
      dataPromise={enterpriseOrdersPromise}
      dataSelector={(response) => response.data}
      dataTotalSelector={(response) => response.total}
      filters={filters}
      key={key}
      onLoadMore={async ({ limit, skip }) => {
        const response =
          await enterpriseOrdersApi.fetchEnterpriseOrdersPaginated({
            filter: filters,
            limit,
            skip,
            sorting,
          });
        // console.log('EnterpriseOrders - onLoadMore :', {
        //   hasMore: response.hasMore,
        //   limit,
        //   response,
        //   skip,
        //   total: response.total,
        // });

        return {
          data: response.data,
          hasMore: response.hasMore,
          total: response.total,
        };
      }}
      persistenceKey={PERSISTENCE_KEY}
      sorting={sorting}
      title='Enterprise Orders - Infinite Scroll'
    />
  );
};
