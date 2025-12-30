import * as stylex from '@stylexjs/stylex';
import { useLoaderData } from 'react-router';

import type { TableColumn } from '@/components/Table/Table.types';
import type { CarSale } from '@/services';

import { Table } from '@/components/Table';

import type { loader } from './car-sales.loader';

import { styles } from './CarSales.stylex';
// Define table columns for car sales data
const columns: TableColumn[] = [
  {
    dataType: 'number',
    key: 'car_id',
    label: 'ID',
    minWidth: 80,
  },
  {
    dataType: 'string',
    key: 'model',
    label: 'Model',
    minWidth: 100,
  },
  {
    dataType: 'number',
    key: 'year',
    label: 'Year',
    minWidth: 80,
  },
  {
    dataType: 'string',
    key: 'color',
    label: 'Color',
    minWidth: 100,
  },
  {
    dataType: 'string',
    key: 'country',
    label: 'Country',
    minWidth: 120,
  },
  {
    dataType: 'string',
    key: 'city',
    label: 'City',
    minWidth: 120,
  },
  {
    dataType: 'currency',
    key: 'purchase_price',
    label: 'Purchase Price',
    minWidth: 130,
  },
  {
    dataType: 'currency',
    key: 'sale_price',
    label: 'Sale Price',
    minWidth: 120,
  },
  {
    dataType: 'currency',
    key: 'profit',
    label: 'Profit',
    minWidth: 120,
  },
  {
    dataType: 'number',
    key: 'mileage',
    label: 'Mileage',
    minWidth: 100,
  },
  {
    dataType: 'string',
    key: 'fuel_type',
    label: 'Fuel Type',
    minWidth: 100,
  },
  {
    dataType: 'string',
    key: 'transmission',
    label: 'Transmission',
    minWidth: 110,
  },
  {
    dataType: 'string',
    key: 'buyer_name',
    label: 'Buyer',
    minWidth: 150,
  },
  {
    dataType: 'string',
    key: 'seller_name',
    label: 'Seller',
    minWidth: 150,
  },
  {
    dataType: 'date',
    key: 'date_of_sale',
    label: 'Sale Date',
    minWidth: 120,
  },
];

export const CarSales = () => {
  const { carSales } = useLoaderData<typeof loader>();

  return (
    <div {...stylex.props(styles.container)}>
      <div {...stylex.props(styles.header)}>
        <h1>Car Sales Data</h1>
        <p>Total Records: {carSales.length}</p>
      </div>
      <Table<CarSale>
        columns={columns}
        data={carSales}
        density='comfortable'
        isBordered
        isStriped
      />
    </div>
  );
};
