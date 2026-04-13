import type { SortRule } from '../../types/api.types';

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
