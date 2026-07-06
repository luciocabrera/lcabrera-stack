import { TableLayout } from '@repo/ui/components/Table/TableLayout';
import { useLoaderData } from 'react-router';

import type { EnterpriseOrder, EnterpriseOrdersResponse } from '@/services';

import { enterpriseOrdersApi } from '@/services';

import type { loader } from './enterprise-orders.loader';

import { CRUD } from './EnterpriseOrders.constants';
import { hydrateEnterpriseOrdersColumnsState } from './hydrateEnterpriseOrdersColumnsState.util';

export const EnterpriseOrders = () => {
  const { columnsState, enterpriseOrdersPromise, metaState } =
    useLoaderData<typeof loader>();
  const hydratedColumnsState =
    hydrateEnterpriseOrdersColumnsState(columnsState);

  return (
    <TableLayout<EnterpriseOrder, EnterpriseOrdersResponse>
      columnsState={hydratedColumnsState}
      crud={CRUD}
      dataPromise={enterpriseOrdersPromise}
      dataSelector={(response) => response.data}
      dataTotalSelector={(response) => response.total}
      metaState={metaState}
      onLoadMore={async ({ limit, skip }) =>
        enterpriseOrdersApi.fetchEnterpriseOrdersPaginated({
          filter: hydratedColumnsState?.columnFilters ?? {},
          limit,
          skip,
          sorting: hydratedColumnsState?.sorting ?? [],
        })
      }
    />
  );
};
