import { useLoaderData } from 'react-router';

import type { CarSale, CarSalesResponse } from '@/services';

import { TableLayout } from '@/components/Table/TableLayout';

import type { loader } from './car-sales.loader';

export const CarSales = () => {
  const { carSalesPromise, columnsState, metaState } =
    useLoaderData<typeof loader>();

  return (
    <TableLayout<CarSale, CarSalesResponse>
      columnsState={columnsState}
      dataPromise={carSalesPromise}
      dataSelector={(response) => response.data}
      dataTotalSelector={(response) => response.total}
      metaState={metaState}
    />
  );
};
