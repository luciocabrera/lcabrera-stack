import { useLoaderData } from 'react-router';

import type { CarSale } from '@/services';

import { TableLayout } from '@/components/Table/TableLayout';
import { carSalesApi } from '@/services';

import type { CarSalesPaginatedResponse } from './CarSales.types';
import type { loader } from './root';

export const CarSales = () => {
  const { carSalesPromise, columnsState, metaState } =
    useLoaderData<typeof loader>();

  return (
    <TableLayout<CarSale, CarSalesPaginatedResponse>
      columnsState={columnsState}
      dataPromise={carSalesPromise}
      dataSelector={(response) => response.data}
      dataTotalSelector={(response) => response.total}
      metaState={metaState}
      onLoadMore={async ({ limit, skip }) =>
        carSalesApi.fetchCarSalesPaginated({
          limit,
          skip,
          sorting: columnsState?.sorting ?? [],
        })
      }
    />
  );
};
