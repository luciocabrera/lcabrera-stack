import type { CarSale } from '@/services';

export type CarSaleRow = Omit<CarSale, CarSaleDateColumn> & {
  readonly [Column in CarSaleDateColumn]: Date;
};

type CarSaleDateColumn =
  | 'date_of_ingress'
  | 'date_of_sale'
  | 'insurance_expiration_date';
