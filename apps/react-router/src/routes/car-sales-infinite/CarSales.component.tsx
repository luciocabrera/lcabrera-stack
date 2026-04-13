import { useLoaderData } from 'react-router';

import type { CarSale } from '@/services';

import { TableLayout } from '@/components/Table/TableLayout';
import { carSalesApi } from '@/services';

import type { loader } from './car-sales.loader.ts';
import type { CarSalesPaginatedResponse } from './CarSales.types.ts';

import { COLUMNS, PERSISTENCE_KEY } from './CarSales.constants.tsx';

export const CarSales = () => {
  const {
    carSalesPromise,
    columnOrder,
    columnSizing,
    columnVisibility,
    filters,
    key,
    sorting,
  } = useLoaderData<typeof loader>();

  return (
    <TableLayout<CarSale, CarSalesPaginatedResponse>
      columnOrder={columnOrder}
      columns={COLUMNS}
      columnSizing={columnSizing}
      columnVisibility={columnVisibility}
      dataPromise={carSalesPromise}
      dataSelector={(response) => response.data}
      dataTotalSelector={(response) => response.total}
      filters={filters}
      onLoadMore={async ({ limit, skip }) =>
        carSalesApi.fetchCarSalesPaginated({
          limit,
          skip,
          sorting,
        })
      }
      persistenceKey={PERSISTENCE_KEY}
      sorting={sorting}
      suspenseKey={key}
      title='Car Sales Data - Infinite Scroll'
    />
  );
};
