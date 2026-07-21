import type { TableColumn } from '@lcabrera/ui/components/Table/Table.types';

import type { CarSale } from '@/services';

export const PERSISTENCE_KEY = 'car-sales-table';
export const SCHEMA_NAME = 'public';
export const TABLE_NAME = 'car_sales';
export const TITLE = {
  plural: 'Car Sales Data',
  singular: 'Car Sale',
};

/**
 * How many rows this route loads up front.
 *
 * Unlike its `car-sales-infinite` sibling, this route deliberately loads its
 * rows in one shot and paginates them in memory — it never fetches again, so
 * whatever it asks for here is the whole dataset it will ever show.
 *
 * That demo only stays honest while the slice is small. It previously asked
 * for the table unbounded, and `car_sales` holds 500k rows: a single request
 * produced a ~421MB JSON body, and SSR died with `Zone Allocation failed`
 * while serializing it into the hydration payload (~2.4GB RSS). Raising the
 * heap does not help — a V8 zone is malloc-backed, outside the JS heap — and
 * both the response and the encoded payload were within ~1.6x of V8's hard
 * 512MB string limit, so a modestly larger table would throw outright.
 *
 * 1000 rows demonstrates the same in-memory pagination at ~0.8MB.
 */
export const CLIENT_PAGINATION_ROW_LIMIT = 1000;

/**
 * Column definitions for the CarSale data table.
 * Shared between car-sales (paginated) and car-sales-infinite routes.
 */
export const COLUMNS: TableColumn<CarSale>[] = [
  {
    dataType: 'number',
    isPrimaryKey: true,
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
