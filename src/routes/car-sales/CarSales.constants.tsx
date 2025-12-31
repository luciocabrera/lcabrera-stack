import type { TableColumn } from '@/components/Table/Table.types';

export const columns: TableColumn[] = [
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
