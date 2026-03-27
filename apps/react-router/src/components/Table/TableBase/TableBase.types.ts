import type { ComponentPropsWithRef } from "react";

import type { TableProps } from "../Table.types.ts";

export type TableBaseProps<
  TData extends Record<string, unknown>,
  TResponse,
> = ComponentPropsWithRef<"table"> & Pick<TableProps<TData, TResponse>, "customStylex">;
