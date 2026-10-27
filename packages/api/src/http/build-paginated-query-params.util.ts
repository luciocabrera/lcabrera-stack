import type { PaginatedQuery } from './http.types.ts';

import { COLUMN_FILTERS_PARAM } from '../filters/filters.constants.ts';

export const buildPaginatedQueryParams = ({
  cursor,
  filter,
  limit,
  skip,
  sorting,
}: PaginatedQuery) => {
  const params = new URLSearchParams({
    limit: limit.toString(),
    skip: skip.toString(),
  });

  if (sorting && sorting.length > 0) {
    params.append('sort', JSON.stringify(sorting));
  }

  if (cursor && cursor.length > 0) {
    params.append('cursor', JSON.stringify(cursor));
  }

  if (filter && Object.keys(filter).length > 0) {
    params.append(COLUMN_FILTERS_PARAM, JSON.stringify(filter));
  }

  return params;
};
