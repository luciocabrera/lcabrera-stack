import type { PaginatedQuery } from './http.types.ts';

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

  if (filter && typeof filter === 'object' && Object.keys(filter).length > 0) {
    params.append('filter', JSON.stringify(filter));
  }

  return params;
};
