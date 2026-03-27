import type { TableProps } from "../Table.types.ts";

export type TableSuspenseBoundaryProps<
  TData extends Record<string, unknown>,
  TResponse = TData[],
> = Pick<TableProps<TData, TResponse>, "dataSelector" | "icon"> & {
  /** Child render function receiving resolved data */
  readonly children: (response: TResponse) => React.ReactNode;
  /** Promise that resolves to table data or a response containing table data */
  readonly dataPromise: Promise<TResponse>;
};
