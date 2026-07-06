import type { TableColumn } from '@repo/ui/components/Table/Table.types';

import type { CarSale } from '@/services';

export const PERSISTENCE_KEY = 'car-sales-table';
export const SCHEMA_NAME = 'public';
export const TABLE_NAME = 'car_sales';
export const TITLE = {
  plural: 'Car Sales Data',
  singular: 'Car Sale',
};

/**
 * Column definitions for the CarSale data table.
 * Shared between car-sales (paginated) and car-sales-infinite routes.
 */
export const COLUMNS: TableColumn<CarSale>[] = [
  {
    dataType: 'number',
    key: 'car_id',
    label: 'ID',
    maxWidth: 150,
    minWidth: 80,
  },
  {
    dataType: 'string',
    key: 'model',
    label: 'Model',
    maxWidth: 300,
    minWidth: 100,
  },
  {
    dataType: 'number',
    key: 'year',
    label: 'Year',
    maxWidth: 120,
    minWidth: 80,
  },
  {
    dataType: 'string',
    key: 'color',
    label: 'Color',
    maxWidth: 200,
    minWidth: 100,
  },
  {
    dataType: 'string',
    key: 'country',
    label: 'Country',
    maxWidth: 250,
    minWidth: 120,
  },
  {
    dataType: 'string',
    key: 'city',
    label: 'City',
    maxWidth: 250,
    minWidth: 120,
  },
  {
    dataType: 'currency',
    key: 'purchase_price',
    label: 'Purchase Price',
    maxWidth: 200,
    minWidth: 130,
  },
  {
    dataType: 'currency',
    key: 'sale_price',
    label: 'Sale Price',
    maxWidth: 200,
    minWidth: 120,
  },
  {
    dataType: 'currency',
    key: 'profit',
    label: 'Profit',
    maxWidth: 200,
    minWidth: 120,
  },
  {
    dataType: 'number',
    key: 'mileage',
    label: 'Mileage',
    maxWidth: 150,
    minWidth: 100,
  },
  {
    dataType: 'string',
    key: 'fuel_type',
    label: 'Fuel Type',
    maxWidth: 200,
    minWidth: 100,
  },
  {
    dataType: 'string',
    key: 'transmission',
    label: 'Transmission',
    maxWidth: 200,
    minWidth: 110,
  },
  {
    dataType: 'string',
    key: 'buyer_name',
    label: 'Buyer',
    maxWidth: 300,
    minWidth: 150,
  },
  {
    dataType: 'string',
    key: 'seller_name',
    label: 'Seller',
    maxWidth: 300,
    minWidth: 150,
  },
  {
    dataType: 'date',
    key: 'date_of_sale',
    label: 'Sale Date',
    maxWidth: 180,
    minWidth: 120,
  },
];
