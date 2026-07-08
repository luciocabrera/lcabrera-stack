import type { Pagination } from '@repo/ui/types/ui.types';

import { TableLayout } from '@repo/ui/components/Table/TableLayout';
import { appendPrimaryKeySorting } from '@repo/ui/routing/appendPrimaryKeySorting.util';
import { sanitizeSorting } from '@repo/ui/routing/sanitizeSorting.util';
import { useLoaderData } from 'react-router';

import type { EnterpriseOrder, EnterpriseOrdersResponse } from '@/services';

import { enterpriseOrdersApi } from '@/services';

import type { loader } from './enterprise-orders.loader';

export const EnterpriseOrders = () => {
  const { columnsState, enterpriseOrdersPromise, metaState } =
    useLoaderData<typeof loader>();

  const handleLoadMore = async ({ limit, skip }: Pagination) =>
    enterpriseOrdersApi.fetchEnterpriseOrdersPaginated({
      filter: columnsState?.columnFilters ?? {},
      limit,
      skip,
      sorting: appendPrimaryKeySorting<EnterpriseOrder>({
        columns: columnsState.columns,
        sorting: sanitizeSorting<EnterpriseOrder>(columnsState?.sorting ?? []),
      }),
    });

  return (
    <TableLayout<EnterpriseOrder, EnterpriseOrdersResponse>
      columnsState={columnsState}
      dataPromise={enterpriseOrdersPromise}
      dataSelector={(response) => response.data}
      dataTotalSelector={(response) => response.total}
      metaState={metaState}
      onLoadMore={handleLoadMore}
    />
  );
};
