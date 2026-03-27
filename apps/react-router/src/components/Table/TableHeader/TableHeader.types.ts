import type { ComponentPropsWithoutRef } from "react";

import type { TableProps } from "../Table.types.ts";

export type TableHeaderProps<
  TData extends Record<string, unknown>,
  TResponse,
> = ComponentPropsWithoutRef<"thead"> & Pick<TableProps<TData, TResponse>, "customStylex">;
