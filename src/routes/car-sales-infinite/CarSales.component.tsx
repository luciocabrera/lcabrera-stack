import { useLoaderData } from 'react-router';

import type { CarSale } from '@/services';

import { TableLayout } from '@/layouts/TableLayout';
import { carSalesApi } from '@/services';

import type { loader } from './car-sales.loader';

import { COLUMNS, PERSISTENCE_KEY } from './CarSales.constants';

export const CarSales = () => {
  const {
    carSalesPromise,
    columnOrder,
    columnSizing,
    columnVisibility,
    sorting,
  } = useLoaderData<typeof loader>();

  return (
    <TableLayout<CarSale>
      columnOrder={columnOrder}
      columns={COLUMNS}
      columnSizing={columnSizing}
      columnVisibility={columnVisibility}
      dataPromise={carSalesPromise}
      dataSelector={(response) => (response as { data: CarSale[] }).data}
      infiniteScrollConfig={{
        onLoadMore: async ({ limit, skip, sorting }) => {
          const response = await carSalesApi.fetchCarSalesPaginated({
            limit,
            skip,
            sorting,
          });

          return {
            data: response.data,
            hasMore: response.hasMore,
            total: response.total,
          };
        },
      }}
      persistenceKey={PERSISTENCE_KEY}
      sorting={sorting}
      title='Car Sales Data - Infinite Scroll'
    />
  );
};

