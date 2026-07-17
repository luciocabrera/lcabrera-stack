import { TableLayout } from '@repo/ui/components/Table/TableLayout';
import { useLoaderData } from 'react-router';

import type { CarSale, CarSalesResponse } from '@/services';

import type { loader } from './car-sales.loader';

export const CarSales = () => {
  const { carSalesPromise, columnsState, metaState } =
    useLoaderData<typeof loader>();

  return (
    <TableLayout<CarSale, CarSalesResponse>
      columnsState={columnsState}
      dataPromise={carSalesPromise}
      dataSelector={(response) => response.data}
      // The rows this route loaded are the rows it will ever have — it
      // paginates them in memory and never fetches again. Reporting the
      // server's full `total` here would leave `hasMore` permanently true
      // (it is `totalRows > totalLoadedRows`) and advertise rows that no
      // interaction can reach.
      dataTotalSelector={(response) => response.data.length}
      metaState={metaState}
    />
  );
};
