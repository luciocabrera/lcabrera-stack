import type { Pagination } from '@repo/ui/types/ui.types';

import { TableLayout } from '@repo/ui/components/Table/TableLayout';
import { useLoaderData } from 'react-router';

import type { EnterpriseOrder, EnterpriseOrdersResponse } from '@/services';

import { enterpriseOrdersApi } from '@/services';

import type { loader } from './enterprise-orders.loader';

import { buildEnterpriseOrdersQuery } from './utils/buildEnterpriseOrdersQuery.util';

export const EnterpriseOrders = () => {
  const { columnsState, enterpriseOrdersPromise, metaState } =
    useLoaderData<typeof loader>();

  const handleLoadMore = async ({ limit, skip }: Pagination) =>
    enterpriseOrdersApi.fetchEnterpriseOrdersPaginated(
      buildEnterpriseOrdersQuery({ columnsState, limit, skip }),
    );

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
