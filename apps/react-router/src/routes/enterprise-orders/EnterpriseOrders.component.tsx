import { useLoaderData } from 'react-router';

import type { EnterpriseOrder, EnterpriseOrdersResponse } from '@/services';

import { TableLayout } from '@/components/Table/TableLayout';
import { enterpriseOrdersApi } from '@/services';

import type { loader } from './enterprise-orders.loader';

import {
  COLUMNS,
  DEFAULT_COLUMN_PINNING,
  PERSISTENCE_KEY,
} from './EnterpriseOrders.constants';

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
      defaultColumnPinning={DEFAULT_COLUMN_PINNING}
      filters={filters}
      onLoadMore={async ({ limit, skip }) =>
        enterpriseOrdersApi.fetchEnterpriseOrdersPaginated({
          filter: filters,
          limit,
          skip,
          sorting,
        })
      }
      persistenceKey={PERSISTENCE_KEY}
      schemaName='public'
      sorting={sorting}
      suspenseKey={key}
      tableName='enterprise_orders'
      title='Enterprise Orders - Infinite Scroll'
    />
  );
};
