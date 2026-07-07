import { TableLayout } from '@repo/ui/components/Table/TableLayout';
import { hydrateTableColumnsState } from '@repo/ui/components/Table/utils';
import { appendPrimaryKeySorting } from '@repo/ui/routing/appendPrimaryKeySorting.util';
import { sanitizeSorting } from '@repo/ui/routing/sanitizeSorting.util';
import { useLoaderData } from 'react-router';

import type { EnterpriseOrder, EnterpriseOrdersResponse } from '@/services';

import { enterpriseOrdersApi } from '@/services';

import type { loader } from './enterprise-orders.loader';

import { COLUMNS } from './EnterpriseOrders.constants';

export const EnterpriseOrders = () => {
  const { columnsState, enterpriseOrdersPromise, metaState } =
    useLoaderData<typeof loader>();
  const hydratedColumnsState = hydrateTableColumnsState<EnterpriseOrder>({
    columns: COLUMNS,
    columnsState,
  });

  return (
    <TableLayout<EnterpriseOrder, EnterpriseOrdersResponse>
      columnsState={hydratedColumnsState}
      dataPromise={enterpriseOrdersPromise}
      dataSelector={(response) => response.data}
      dataTotalSelector={(response) => response.total}
      metaState={metaState}
      onLoadMore={async ({ limit, skip }) =>
        enterpriseOrdersApi.fetchEnterpriseOrdersPaginated({
          filter: hydratedColumnsState?.columnFilters ?? {},
          limit,
          skip,
          sorting: appendPrimaryKeySorting<EnterpriseOrder>({
            columns: hydratedColumnsState.columns,
            sorting: sanitizeSorting<EnterpriseOrder>(
              hydratedColumnsState?.sorting ?? [],
            ),
          }),
        })
      }
    />
  );
};
