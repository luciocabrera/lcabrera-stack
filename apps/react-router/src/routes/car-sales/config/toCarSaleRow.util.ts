import type { CarSale } from '@/services';

import type { CarSaleRow } from './carSales.types';

/**
 * Render one driver row the way the JSON endpoint rendered it: each `date`
 * column as the ISO string `Date.prototype.toJSON` produces.
 *
 * This is not cosmetic. The paginated resource route answers with
 * `Response.json`, which applies exactly this conversion; the SSR loader reads
 * the same rows without any JSON step, and React Router's single fetch revives
 * a `Date` as a `Date`. Without this, the first page a route rendered would
 * carry `Date` objects and every load-more page after it would carry strings —
 * the same table fed two shapes.
 */
export const toCarSaleRow = (row: CarSaleRow) =>
  ({
    ...row,
    date_of_ingress: row.date_of_ingress.toISOString(),
    date_of_sale: row.date_of_sale.toISOString(),
    insurance_expiration_date: row.insurance_expiration_date.toISOString(),
  }) satisfies CarSale;
