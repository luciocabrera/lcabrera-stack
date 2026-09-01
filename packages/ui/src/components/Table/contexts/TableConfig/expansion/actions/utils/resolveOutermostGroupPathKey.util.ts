import type { TableColumn } from '#ui/components/Table/Table.types';

import { resolveGroupPathKey } from '#ui/components/Table/contexts/TableConfig/grouping/utils/resolveGroupPathKey.util';

import { resolveFocusedGroupPath } from './resolveFocusedGroupPath.util';

type ResolveOutermostGroupPathKeyArgs<TData extends Record<string, unknown>> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly focusedRowKey: string | undefined;
  readonly rows: readonly TData[];
};

export const resolveOutermostGroupPathKey = <
  TData extends Record<string, unknown>,
>({
  columns,
  focusedRowKey,
  rows,
}: ResolveOutermostGroupPathKeyArgs<TData>) => {
  const outermost = resolveFocusedGroupPath({
    columns,
    focusedRowKey,
    rows,
  })?.slice(0, 1);

  return outermost === undefined || outermost.length === 0
    ? undefined
    : resolveGroupPathKey(outermost);
};
