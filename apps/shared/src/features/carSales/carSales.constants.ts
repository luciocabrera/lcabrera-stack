import type { SortRule } from '../../types/api.types.js';

export const CAR_SALES_SCHEMA = 'public';
export const CAR_SALES_TABLE = 'car_sales';
export const CAR_SALES_PRIMARY_KEY = 'car_id';

/** Every column of `car_sales`, in alphabetical order. */
export const CAR_SALES_COLUMNS = [
  'buyer_address',
  'buyer_email',
  'buyer_name',
  'buyer_phone',
  'car_id',
  'city',
  'color',
  'country',
  'date_of_ingress',
  'date_of_sale',
  'engine',
  'fuel_type',
  'insurance_expiration_date',
  'insurance_policy_number',
  'insurance_provider',
  'loan_amount',
  'loan_provider',
  'mileage',
  'model',
  'postal_code',
  'profit',
  'purchase_price',
  'sale_price',
  'seller_address',
  'seller_email',
  'seller_name',
  'seller_phone',
  'state',
  'transmission',
  'year',
] as const;

export const CAR_SALES_SORTABLE_COLUMNS = new Set([
  'buyer_address',
  'buyer_email',
  'buyer_name',
  'buyer_phone',
  'car_id',
  'city',
  'color',
  'country',
  'date_of_ingress',
  'date_of_sale',
  'engine',
  'fuel_type',
  'insurance_expiration_date',
  'insurance_policy_number',
  'insurance_provider',
  'loan_amount',
  'loan_provider',
  'mileage',
  'model',
  'postal_code',
  'profit',
  'purchase_price',
  'sale_price',
  'seller_address',
  'seller_email',
  'seller_name',
  'seller_phone',
  'state',
  'transmission',
  'year',
]);

export const DEFAULT_CAR_SALES_SORTING = [
  { columnKey: 'car_id', direction: 'asc' },
] as const satisfies readonly SortRule[];
