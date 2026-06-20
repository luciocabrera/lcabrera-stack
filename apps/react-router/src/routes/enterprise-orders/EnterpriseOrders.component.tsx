import { useLoaderData } from 'react-router';

import type { EnterpriseOrder, EnterpriseOrdersResponse } from '@/services';

import { TableLayout } from '@/components/Table/TableLayout';
import { enterpriseOrdersApi } from '@/services';

import type { loader } from './enterprise-orders.loader';

export const EnterpriseOrders = () => {
  const {
    columnOrder,
    columns,
    columnSizing,
    columnVisibility,
    defaultColumnPinning,
    enterpriseOrdersPromise,
    filters,
    persistenceKey,
    schemaName,
    sorting,
    tableName,
    title,
  } = useLoaderData<typeof loader>();

  return (
    <TableLayout<EnterpriseOrder, EnterpriseOrdersResponse>
      columnOrder={columnOrder}
      columns={columns}
      columnSizing={columnSizing}
      columnVisibility={columnVisibility}
      dataPromise={enterpriseOrdersPromise}
      dataSelector={(response) => response.data}
      dataTotalSelector={(response) => response.total}
      defaultColumnPinning={defaultColumnPinning}
      filters={filters}
      onLoadMore={async ({ limit, skip }) =>
        enterpriseOrdersApi.fetchEnterpriseOrdersPaginated({
          filter: filters,
          limit,
          skip,
          sorting,
        })
      }
      persistenceKey={persistenceKey}
      schemaName={schemaName}
      sorting={sorting}
      tableName={tableName}
      title={title}
    />
  );
};
