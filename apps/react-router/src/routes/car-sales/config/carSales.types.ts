import type { CarSale } from '@/services';

/**
 * One `car_sales` row exactly as `pg` returns it, which is **not** what the
 * table consumes: a `date` column arrives as a `Date`, while `CarSale` declares
 * the ISO string every JSON response carried. `toCarSaleRow` is the one step
 * between the two, and naming the difference in the type is what makes a column
 * added to the table without a matching decision a compile error rather than a
 * cell that renders `[object Object]`.
 *
 * `numeric` columns are absent from this list on purpose: the driver returns
 * those as strings and JSON kept them as strings, so nothing has to change.
 */
export type CarSaleRow = Omit<CarSale, CarSaleDateColumn> & {
  readonly [Column in CarSaleDateColumn]: Date;
};

/**
 * The `date` columns of `car_sales` — the only ones the driver does not already
 * hand back as a JSON primitive.
 */
type CarSaleDateColumn =
  | 'date_of_ingress'
  | 'date_of_sale'
  | 'insurance_expiration_date';
