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
 * `sort` is JSON from the table client; structural narrowing is enough here because the
 * column identifiers are re-validated at the SQL layer (`allowedColumns` +
 * `assertSafeIdentifier`), and the fallback ordering is applied by the service rather than
 * here — so this parser cannot be the reason a page comes back unordered.
 * The floor is because `LIMIT 0` is a page with no rows and a `hasMore` that says the set
 * is exhausted — a scroll session that silently ends.
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
