import type { Pagination } from '@lcabrera/ui';

import { TableLayout } from '@lcabrera/ui';
import { useLoaderData } from 'react-router';

import type {
  EnterpriseOrderListRow,
  EnterpriseOrdersResponse,
} from './config';
import type { loader } from './enterprise-orders.loader';

import { fetchOrdersPage } from './fetchOrdersPage.service';
import { buildEnterpriseOrdersQuery } from './utils/buildEnterpriseOrdersQuery.util';

export const EnterpriseOrders = () => {
  const { columnsState, dataPromise, metaState } =
    useLoaderData<typeof loader>();

  // `lastRow` is the table's own last loaded row: it turns the ADR-008 total
  // order into a keyset cursor, so a deep page seeks instead of counting.
  const handleLoadMore = async ({
    lastRow,
    limit,
    skip,
  }: Pagination<EnterpriseOrderListRow>) =>
    fetchOrdersPage(
      buildEnterpriseOrdersQuery({ columnsState, lastRow, limit, skip }),
    );

  return (
    <TableLayout<EnterpriseOrderListRow, EnterpriseOrdersResponse>
      columnsState={columnsState}
      dataPromise={dataPromise}
      dataSelector={(response) => response.data}
      dataTotalSelector={(response) => response.total}
      metaState={metaState}
      onLoadMore={handleLoadMore}
    />
  );
};
