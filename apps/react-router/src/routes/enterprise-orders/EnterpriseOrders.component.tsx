import { useLoaderData } from 'react-router';

import type { EnterpriseOrder, EnterpriseOrdersResponse } from '@/services';

import { TableLayout } from '@/components/Table/TableLayout';
import { enterpriseOrdersApi } from '@/services';

import type { loader } from './enterprise-orders.loader';
// function isPromise<T = any>(value: any): value is Promise<T> {
//   return (
//     value !== null &&
//     typeof value === 'object' &&
//     typeof value.then === 'function'
//   );
// }

export const EnterpriseOrders = () => {
  const { columnsState, enterpriseOrdersPromise, metaState } =
    useLoaderData<typeof loader>();

  // const data = isPromise(serverData) ? use(serverData) : serverData;

  // const enterpriseOrdersPromise = isPromise(data)
  //   ? data.enterpriseOrdersPromise
  //   : data.enterpriseOrdersPromise;
  // const uiState = readPersistedUiStateFromSessionStorage({
  //   persistenceKey: PERSISTENCE_KEY,
  // });

  // const columnsStateData = {
  //   columnFilters: data.filters,
  //   columnOrder: data.columnOrder,
  //   columnPinning: data.defaultColumnPinning,
  //   columns: data.columns,
  //   columnSizing: data.columnSizing,
  //   columnVisibility: data.columnVisibility,
  //   sorting: data.sorting,
  // };

  // const metaStateData = {
  //   // additionalMetadata: data.additionalMetadata,
  //   // density: data.density,
  //   // enablePrefetch: data.enablePrefetch,
  //   // isBordered: data.isBordered,
  //   // isStriped: data.isStriped,
  //   // loadMorePageSize: data.loadMorePageSize,
  //   persistenceKey: data.persistenceKey,
  //   schemaName: data.schemaName,
  //   tableName: data.tableName,
  //   title: data.title,
  //   ...uiState,
  // };

  console.log('EnterpriseOrders render', {
    columnsState,
    enterpriseOrdersPromise,
    metaState,
  });

  // console.log('EnterpriseOrders render', {
  //   columnOrder,
  //   columnState,
  //   enterpriseOrdersPromise,
  //   serverData,
  //   uiState,
  // });
  //  const {  enterpriseOrdersPromise } = serverData;
  //   // const { columnsState, enterpriseOrdersPromise, metaState } =
  //   //   useLoaderData<typeof clientLoader>();

  //   if (!columnsState || !metaState) {
  //     console.error('Missing columnsState or metaState in loader data', {
  //       columnsState,
  //       metaState,
  //     });
  //     debugger;
  //     return;
  //   }

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
