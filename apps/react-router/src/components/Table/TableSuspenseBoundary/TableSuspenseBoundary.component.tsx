import { Suspense } from "react";

import { TableDataResolver } from "@/components/Table/TableDataResolver";

import type { TableSuspenseBoundaryProps } from "./TableSuspenseBoundary.types.ts";

import { TableSkeleton } from "../TableSkeleton/index.ts";

export const TableSuspenseBoundary = <TData extends Record<string, unknown>, TResponse>({
  children,
  dataPromise,
}: TableSuspenseBoundaryProps<TData, TResponse>) => {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <TableDataResolver<TResponse> dataPromise={dataPromise}>{children}</TableDataResolver>
    </Suspense>
  );
};
