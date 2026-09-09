/**
 * Runs a column filter-options fetch inside renderHook so suites share the act.
 */

import { act, renderHook } from '@testing-library/react';

type FilterFetchFn = (args: {
  readonly dataSelector: (response: FilterFetchResponse) => string[];
  readonly dataTotalSelector: (response: FilterFetchResponse) => number;
  readonly onLoadMore: OnLoadMore;
}) => Promise<unknown>;

type FilterFetchResponse = {
  readonly rows: readonly string[];
  readonly total: number;
};

type InvokeColumnFilterFetchArgs = {
  readonly createFetch: () => FilterFetchFn;
  readonly onLoadMore?: OnLoadMore;
};

type OnLoadMore = (params: {
  readonly lastRow?: unknown;
  readonly limit: number;
  readonly skip: number;
}) => Promise<FilterFetchResponse>;

export const invokeColumnFilterFetch = async ({
  createFetch,
  onLoadMore = async () => ({ rows: [], total: 0 }),
}: InvokeColumnFilterFetchArgs) => {
  const { result } = renderHook(createFetch);

  await act(async () => {
    await result.current({
      dataSelector: (response) => [...response.rows],
      dataTotalSelector: (response) => response.total,
      onLoadMore,
    });
  });

  return result;
};
