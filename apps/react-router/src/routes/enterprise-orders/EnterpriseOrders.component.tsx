import { TableLayout } from '@repo/ui/components/Table/TableLayout';
import { useLoaderData } from 'react-router';

import type { EnterpriseOrder, EnterpriseOrdersResponse } from '@/services';

import { enterpriseOrdersApi } from '@/services';

import type { loader } from './enterprise-orders.loader';

export const EnterpriseOrders = () => {
  const { columnsState, enterpriseOrdersPromise, metaState } =
    useLoaderData<typeof loader>();

  return (
    <TableLayout<EnterpriseOrder, EnterpriseOrdersResponse>
      columnsState={columnsState}
      dataPromise={enterpriseOrdersPromise}
      dataSelector={(response) => response.data}
      dataTotalSelector={(response) => response.total}
      metaState={metaState}
      onLoadMore={async ({ limit, skip }) =>
        enterpriseOrdersApi.fetchEnterpriseOrdersPaginated({
          filter: columnsState?.columnFilters ?? {},
          limit,
          skip,
          sorting: columnsState?.sorting ?? [],
        })
      }
    />
  );
};
