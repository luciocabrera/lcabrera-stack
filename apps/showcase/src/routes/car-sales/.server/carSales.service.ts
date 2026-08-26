import type { ColumnSort } from '@lcabrera/server/sort/sort.types';
import type { SortingState } from '@lcabrera/ui/components/Table';

import { getRowsCount } from '@lcabrera/server/db/get-rows-count.util';
import { selectRows } from '@lcabrera/server/db/select-rows.util';
import { resolveQuerySort } from '@lcabrera/server/sort/resolve-query-sort.util';
import { sanitizeSorting } from '@lcabrera/ui/routing/shared/sanitizeSorting.util';

import type { CarSale } from '@/services';

import { fetchCarSalesPage } from '@/services';
import { fakeDelay } from '@/services/fakeDelay.util';
import { isExternalApiEnabled } from '@/services/isExternalApiEnabled.util';

import type { CarSaleRow } from '../config';

import {
  CAR_SALES_ALLOWED_COLUMNS,
  CAR_SALES_COLUMNS,
  CAR_SALES_FALLBACK_SORT,
  CAR_SALES_PRIMARY_KEY,
  CAR_SALES_SCHEMA,
  CAR_SALES_TABLE,
  MAX_CAR_SALES_SORT_RULES,
  toCarSaleRow,
} from '../config';

/**
 * Server-only Postgres access for `car_sales`. Lives in `.server/`, so the build fails if
 * client code imports it. Reaches the pool via `getPool`.
 */

const TARGET = {
  allowedColumns: CAR_SALES_ALLOWED_COLUMNS,
  schema: CAR_SALES_SCHEMA,
  table: CAR_SALES_TABLE,
} as const;

export type SelectCarSalesPageArgs = {
  readonly limit: number;
  readonly offset: number;
  /**
   * Resolved against `CAR_SALES_FALLBACK_SORT` here rather than by each caller, so the SSR
   * loader and the paginated resource route cannot order a page two different ways.
   */
  readonly sorting: readonly ColumnSort[];
};

/** There is no filter argument: this endpoint never filtered server-side. */
export const selectCarSalesPage = async ({
  limit,
  offset,
  sorting,
}: SelectCarSalesPageArgs) => {
  const boundedSorting = sorting.slice(0, MAX_CAR_SALES_SORT_RULES);

  const [rows, total] = await Promise.all([
    selectRows<CarSaleRow>({
      ...TARGET,
      fields: CAR_SALES_COLUMNS,
      limit,
      offset,
      sort: resolveQuerySort({
        fallback: CAR_SALES_FALLBACK_SORT,
        sorting: boundedSorting,
      }),
    }),
    getRowsCount({ ...TARGET, column: CAR_SALES_PRIMARY_KEY }),
  ]);

  const data = rows.map((row) => toCarSaleRow(row));

  return { data, hasMore: offset + data.length < total, total };
};

export type ReadCarSalesPageArgs = {
  readonly limit: number;
  readonly requestUrl: string;
  readonly skip: number;
  readonly sorting: SortingState<CarSale>;
};

export const readCarSalesPage = async ({
  limit,
  requestUrl,
  skip,
  sorting,
}: ReadCarSalesPageArgs) => {
  if (isExternalApiEnabled()) {
    return fetchCarSalesPage({ limit, requestUrl, skip, sorting });
  }

  await fakeDelay();

  return selectCarSalesPage({
    limit,
    offset: skip,
    sorting: sanitizeSorting<CarSale>(sorting),
  });
};
