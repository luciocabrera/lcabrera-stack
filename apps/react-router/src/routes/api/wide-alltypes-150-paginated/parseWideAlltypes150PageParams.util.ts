import type { SortingState } from '@lcabrera/ui/components/Table';

import { INITIAL_PAGE_SIZE } from '@lcabrera/ui/components/Table/Table.constants';
import { sanitizeSorting } from '@lcabrera/ui/routing/shared/sanitizeSorting.util';
import { safeJsonParse } from '@lcabrera/utils/json/safe-json-parse.util';
import { parsePositiveInteger } from '@lcabrera/utils/numbers/parse-positive-integer.util';

import type { WideAlltypes150 } from '@/services';

import { MAX_WIDE_ALLTYPES_LIMIT } from '@/routes/wide-alltypes-150/config';

export type ParsedWideAlltypes150PageParams = {
  readonly limit: number;
  readonly skip: number;
  readonly sorting: ReturnType<typeof sanitizeSorting<WideAlltypes150>>;
};

/**
 * Parse the paginated wide-alltypes resource-route search params into the
 * window and sort the service takes.
 *
 * `limit` is clamped into `[1, MAX_WIDE_ALLTYPES_LIMIT]`, which the JSON
 * endpoint this replaces also did: a row here is 150 columns wide, and the URL
 * is public. Narrowing the sort to what the table can order by is the service's
 * job, not this parser's — the SSR loader never passes through here and needs
 * the same narrowing.
 */
export const parseWideAlltypes150PageParams = (
  params: URLSearchParams,
): ParsedWideAlltypes150PageParams => {
  const rawSort = safeJsonParse(params.get('sort'));
  const requestedLimit = parsePositiveInteger({
    fallback: INITIAL_PAGE_SIZE,
    value: params.get('limit') ?? undefined,
  });

  return {
    limit: Math.min(MAX_WIDE_ALLTYPES_LIMIT, Math.max(1, requestedLimit)),
    skip: parsePositiveInteger({
      fallback: 0,
      value: params.get('skip') ?? undefined,
    }),
    sorting: sanitizeSorting<WideAlltypes150>(
      Array.isArray(rawSort) ? (rawSort as SortingState<WideAlltypes150>) : [],
    ),
  };
};
