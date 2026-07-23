import type { Pagination } from '@lcabrera/ui';

import { TableLayout } from '@lcabrera/ui';
import { useLoaderData } from 'react-router';

import type { EnterpriseOrder, EnterpriseOrdersResponse } from './config';
import type { loader } from './enterprise-orders.loader';

import { fetchOrdersPage } from './fetchOrdersPage.service';
import { buildEnterpriseOrdersQuery } from './utils/buildEnterpriseOrdersQuery.util';

export const EnterpriseOrders = () => {
  const { columnsState, dataPromise, metaState } =
    useLoaderData<typeof loader>();

  const handleLoadMore = async ({ limit, skip }: Pagination) =>
    fetchOrdersPage(buildEnterpriseOrdersQuery({ columnsState, limit, skip }));

  return (
    <TableLayout<EnterpriseOrder, EnterpriseOrdersResponse>
      columnsState={columnsState}
      dataPromise={dataPromise}
      dataSelector={(response) => response.data}
      dataTotalSelector={(response) => response.total}
      metaState={metaState}
      onLoadMore={handleLoadMore}
    />
  );
};
