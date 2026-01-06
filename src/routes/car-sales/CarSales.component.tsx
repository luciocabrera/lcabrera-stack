import * as stylex from '@stylexjs/stylex';
import { useLoaderData } from 'react-router';

import type { CarSale, CarSalesResponse } from '@/services';

import { Table } from '@/components/Table';
import { TableSuspenseBoundary } from '@/components/Table/TableSuspenseBoundary/TableSuspenseBoundary.component';

import type { loader } from './car-sales.loader';

import { columns } from './CarSales.constants';
import { styles } from './CarSales.stylex';

export const CarSales = () => {
  const { carSalesPromise } = useLoaderData<typeof loader>();

  return (
    <div {...stylex.props(styles.container)}>
      <TableSuspenseBoundary<CarSale, CarSalesResponse>
        columns={columns}
        dataPromise={carSalesPromise}
        dataSelector={(response) => response.data}
        persistenceKey='car-sales-table'
        title='Car Sales Data'
      >
        {(data) => (
          <Table
            columns={columns}
            data={data}
            density='comfortable'
            isBordered
            isClientSortingEnabled
            isStriped
            persistenceKey='car-sales-table'
            title='Car Sales Data'
          />
        )}
      </TableSuspenseBoundary>
    </div>
  );
};
