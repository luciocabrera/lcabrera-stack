import type { LoaderFunctionArgs } from "react-router";

import type { ColumnSizingState, SortingState } from "@/components/Table";
import type { WideAlltypes150, WideAlltypes150Response } from "@/services";

import { readPersistedStateFromCookie } from "@/components/Table/utils";
import { INITIAL_PAGE_SIZE } from "@/components/Table/Table.constants";
import { wideAlltypes150Api } from "@/services";
import { deserializeSortingFromURL, readTableStateFromURL } from "@/utils/urlState";

import { PERSISTENCE_KEY } from "./WideAlltypes150.constants.ts";

export const loader = ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const urlState = readTableStateFromURL({
    persistenceKey: PERSISTENCE_KEY,
    searchParams: url.searchParams,
  });
  const cookieHeader = request.headers.get("Cookie");
  const cookieState = readPersistedStateFromCookie({
    cookieString: cookieHeader ?? undefined,
    persistenceKey: PERSISTENCE_KEY,
  });

  const columnOrder = (urlState?.columnOrder ??
    cookieState.columnOrder ??
    []) as (keyof WideAlltypes150)[];

  const columnVisibility = (urlState?.columnVisibility ??
    cookieState.columnVisibility ??
    new Set()) as Set<keyof WideAlltypes150>;

  const columnSizing = (cookieState.columnSizing ?? {}) as ColumnSizingState<WideAlltypes150>;

  const standaloneSortParam = url.searchParams.get("sort");
  let sorting: SortingState<WideAlltypes150> = [];
  if (standaloneSortParam) {
    sorting = deserializeSortingFromURL<WideAlltypes150>(standaloneSortParam);
  }

  const filteredSorting = sorting.filter(
    (s): s is { columnKey: keyof WideAlltypes150; direction: "asc" | "desc" } =>
      s.direction !== undefined && s.columnKey !== "actions",
  );

  const dataPromise: Promise<WideAlltypes150Response> = wideAlltypes150Api.fetchPaginated({
    limit: INITIAL_PAGE_SIZE,
    requestUrl: request.url,
    skip: 0,
    sorting: filteredSorting,
  });

  return {
    columnOrder,
    columnSizing,
    columnVisibility,
    dataPromise,
    key: standaloneSortParam ?? "",
    sorting: filteredSorting,
  };
};
