import { TableLayout } from '@lcabrera/ui/components/Table/TableLayout';
import { useLoaderData } from 'react-router';

import type { loader } from './orders.loader';
import type { Order, OrdersPage } from './orders.types';

export const Orders = () => {
  const { columnsState, dataPromise, metaState } =
    useLoaderData<typeof loader>();

  return (
    <TableLayout<Order, OrdersPage>
      columnsState={columnsState}
      dataPromise={dataPromise}
      dataSelector={(response) => response.data}
      dataTotalSelector={(response) => response.total}
      metaState={metaState}
    />
  );
};
