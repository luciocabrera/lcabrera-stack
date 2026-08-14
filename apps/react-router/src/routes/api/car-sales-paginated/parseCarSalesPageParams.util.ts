import type { SortingState } from '@lcabrera/ui/components/Table';

import { INITIAL_PAGE_SIZE } from '@lcabrera/ui/components/Table/Table.constants';
import { sanitizeSorting } from '@lcabrera/ui/routing/shared/sanitizeSorting.util';
import { safeJsonParse } from '@lcabrera/utils/json/safe-json-parse.util';
import { parsePositiveInteger } from '@lcabrera/utils/numbers/parse-positive-integer.util';

import type { CarSale } from '@/services';

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
 * `limit` has a floor of 1 rather than passing `0` through: `LIMIT 0` is a page
 * with no rows and a `hasMore` that says the set is exhausted, which is a
 * scroll session that silently ends. The JSON endpoint this replaces clamped it
 * the same way.
 */
export const parseCarSalesPageParams = (
  params: URLSearchParams,
): ParsedCarSalesPageParams => {
  const rawSort = safeJsonParse(params.get('sort'));

  return {
    limit: Math.max(
      1,
      parsePositiveInteger({
        fallback: INITIAL_PAGE_SIZE,
        value: params.get('limit') ?? undefined,
      }),
    ),
    skip: parsePositiveInteger({
      fallback: 0,
      value: params.get('skip') ?? undefined,
    }),
    sorting: sanitizeSorting<CarSale>(
      Array.isArray(rawSort) ? (rawSort as SortingState<CarSale>) : [],
    ),
  };
};
