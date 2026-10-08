import type { SortingState } from '@lcabrera/ui/components/Table';

import { INITIAL_PAGE_SIZE } from '@lcabrera/ui/components/Table/Table.constants';
import { safeJsonParse } from '@lcabrera/utils/json/safe-json-parse.util';
import { parsePositiveInteger } from '@lcabrera/utils/numbers/parse-positive-integer.util';

import { EVALS_TRIALS_PAGE_LIMIT } from '../constants/evalsDashboard.constants';
import { toTrialSorting } from '../utils/toTrialSorting.util';

export const parseTrialPageParams = (params: URLSearchParams) => {
  const rawSort = safeJsonParse(params.get('sort'));
  const requestedLimit = parsePositiveInteger({
    fallback: INITIAL_PAGE_SIZE,
    value: params.get('limit') ?? undefined,
  });

  return {
    limit: Math.min(EVALS_TRIALS_PAGE_LIMIT, Math.max(1, requestedLimit)),
    offset: parsePositiveInteger({
      fallback: 0,
      value: params.get('skip') ?? undefined,
    }),
    sorting: toTrialSorting(
      Array.isArray(rawSort) ? (rawSort as SortingState) : [],
    ),
  };
};
