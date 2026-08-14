import type { SortingState } from '@lcabrera/ui/components/Table';

import { INITIAL_PAGE_SIZE } from '@lcabrera/ui/components/Table/Table.constants';
import { sanitizeSorting } from '@lcabrera/ui/routing/shared/sanitizeSorting.util';
import { safeJsonParse } from '@lcabrera/utils/json/safe-json-parse.util';
import { parsePositiveInteger } from '@lcabrera/utils/numbers/parse-positive-integer.util';

import type { CarSale } from '@/services';

import { MAX_CAR_SALES_LIMIT } from '@/routes/car-sales/config';

export type ParsedCarSalesPageParams = {
  readonly limit: number;
  readonly skip: number;
  readonly sorting: ReturnType<typeof sanitizeSorting<CarSale>>;
};

/**
 * Parse the paginated car-sales resource-route search params into the window
 * and sort the service takes.
 *
 * `sort` is JSON from the table client; structural narrowing is enough here
 * because the column identifiers are re-validated at the SQL layer
 * (`allowedColumns` + `assertSafeIdentifier`), and the fallback ordering is
 * applied by the service rather than here — so this parser cannot be the reason
 * a page comes back unordered.
 *
 * `limit` is clamped into `[1, MAX_CAR_SALES_LIMIT]`. The floor is because
 * `LIMIT 0` is a page with no rows and a `hasMore` that says the set is
 * exhausted — a scroll session that silently ends. The ceiling is because this
 * is a public, unauthenticated URL over a 500k-row table, so an uncapped
 * `?limit=` is a whole-table read; the endpoint this replaced had the same gap,
 * and it is closed here rather than reproduced (#701 review).
 */
export const parseCarSalesPageParams = (
  params: URLSearchParams,
): ParsedCarSalesPageParams => {
  const rawSort = safeJsonParse(params.get('sort'));
  const requestedLimit = parsePositiveInteger({
    fallback: INITIAL_PAGE_SIZE,
    value: params.get('limit') ?? undefined,
  });

  return {
    limit: Math.min(MAX_CAR_SALES_LIMIT, Math.max(1, requestedLimit)),
    skip: parsePositiveInteger({
      fallback: 0,
      value: params.get('skip') ?? undefined,
    }),
    sorting: sanitizeSorting<CarSale>(
      Array.isArray(rawSort) ? (rawSort as SortingState<CarSale>) : [],
    ),
  };
};
