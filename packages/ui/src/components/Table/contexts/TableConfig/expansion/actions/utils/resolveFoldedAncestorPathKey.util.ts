import type { TableColumn } from '#ui/components/Table/Table.types';

import { resolveGroupPathKey } from '#ui/components/Table/contexts/TableConfig/grouping/utils/resolveGroupPathKey.util';

import { resolveFocusedGroupPath } from './resolveFocusedGroupPath.util';

type ResolveFoldedAncestorPathKeyArgs<TData extends Record<string, unknown>> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly focusedRowKey: string | undefined;
  readonly foldedPaths: ReadonlySet<string>;
  readonly rows: readonly TData[];
};

export const resolveFoldedAncestorPathKey = <
  TData extends Record<string, unknown>,
>({
  columns,
  focusedRowKey,
  foldedPaths,
  rows,
}: ResolveFoldedAncestorPathKeyArgs<TData>) => {
  const path = resolveFocusedGroupPath({ columns, focusedRowKey, rows });

  if (path === undefined) return;

  const prefixKeys = path.map((_unused, index) =>
    resolveGroupPathKey(path.slice(0, index + 1)),
  );

  return prefixKeys.find((pathKey) => foldedPaths.has(pathKey));
};
