import type { SortingState } from "@tanstack/react-table";

import type { WideAlltypes150Response } from "@/services";

export type ResolveNextPageParamArgs = {
  readonly allPages: readonly WideAlltypes150Response[];
  readonly lastPage: WideAlltypes150Response;
};

export type WideAlltypes150TanStackTableContentProps = {
  readonly initialPage: WideAlltypes150Response;
  readonly initialSorting: SortingState;
  readonly initialSortParam: string;
};
