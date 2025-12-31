import * as stylex from '@stylexjs/stylex';
import { useLoaderData } from 'react-router';

import type { CarSale, CarSalesResponse } from '@/services';

import { Table, TableSuspenseBoundary } from '@/components/Table';

import type { loader } from './car-sales.loader';

import { columns } from './CarSales.constants';
import { styles } from './CarSales.stylex';

export const CarSales = () => {
  const { carSalesPromise } = useLoaderData<typeof loader>();

  return (
    <div {...stylex.props(styles.container)}>
      <div {...stylex.props(styles.header)}>
        <h1>Car Sales Data</h1>
      </div>

      <TableSuspenseBoundary<CarSale, CarSalesResponse>
        columns={columns}
        dataPromise={carSalesPromise}
        dataSelector={(response) => response.data}
      >
        {(data) => (
          <Table
            columns={columns}
            data={data}
            density='comfortable'
            isBordered
            isStriped
          />
        )}
      </TableSuspenseBoundary>
    </div>
  );
};
