import { TableLayout } from '@lcabrera/ui/components/Table/TableLayout';
import { useLoaderData } from 'react-router';

import type { CarSale, CarSalesResponse } from '@/services';

import type { loader } from './car-sales.loader';

export const CarSales = () => {
  const { columnsState, dataPromise, metaState } =
    useLoaderData<typeof loader>();

  return (
    <TableLayout<CarSale, CarSalesResponse>
      columnsState={columnsState}
      dataPromise={dataPromise}
      dataSelector={(response) => response.data}
      dataTotalSelector={(response) => response.data.length}
      metaState={metaState}
    />
  );
};
