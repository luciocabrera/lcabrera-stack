import * as stylex from '@stylexjs/stylex';
import { Suspense, use } from 'react';
import { useLoaderData } from 'react-router';

import type { CarSale, CarSalesResponse } from '@/services';

import { Table } from '@/components/Table';

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
      <Suspense
        fallback={
          <Table<CarSale>
            columns={columns}
            data={[]}
            density='comfortable'
            isBordered
            isLoading
            isStriped
          />
        }
      >
        <CarSalesTable dataPromise={carSalesPromise} />
      </Suspense>
    </div>
  );
};

/**
 * Async table component that uses React 19's use() hook
 */
const CarSalesTable = ({
  dataPromise,
}: {
  dataPromise: Promise<CarSalesResponse>;
}) => {
  const response = use(dataPromise);

  return (
    <>
      <Table<CarSale>
        columns={columns}
        data={response.data}
        density='comfortable'
        isBordered
        isStriped
      />
    </>
  );
};
