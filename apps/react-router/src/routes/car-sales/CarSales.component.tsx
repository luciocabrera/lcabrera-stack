import { useLoaderData } from 'react-router';

import type { CarSale, CarSalesResponse } from '@/services';

import { TableLayout } from '@/components/Table/TableLayout';

import type { loader } from './car-sales.loader.ts';

import { COLUMNS, PERSISTENCE_KEY } from './CarSales.constants.tsx';

export const CarSales = () => {
  const {
    carSalesPromise,
    columnOrder,
    columnSizing,
    columnVisibility,
    sorting,
  } = useLoaderData<typeof loader>();

  return (
    <TableLayout<CarSale, CarSalesResponse>
      columnOrder={columnOrder}
      columns={COLUMNS}
      columnSizing={columnSizing}
      columnVisibility={columnVisibility}
      dataPromise={carSalesPromise}
      dataSelector={(response) => response.data}
      dataTotalSelector={(response) => response.total}
      persistenceKey={PERSISTENCE_KEY}
      sorting={sorting}
      title='Car Sales Data'
    />
  );
};
