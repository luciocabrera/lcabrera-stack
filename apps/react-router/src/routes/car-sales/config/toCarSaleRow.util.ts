import type { CarSale } from '@/services';

import type { CarSaleRow } from './carSales.types';

export const toCarSaleRow = (row: CarSaleRow) =>
  ({
    ...row,
    date_of_ingress: row.date_of_ingress.toISOString(),
    date_of_sale: row.date_of_sale.toISOString(),
    insurance_expiration_date: row.insurance_expiration_date.toISOString(),
  }) satisfies CarSale;
