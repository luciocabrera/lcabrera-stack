import type { TableColumn } from '#ui/components/Table/Table.types';

import { resolveGroupPathKey } from '#ui/components/Table/contexts/TableConfig/grouping/utils/resolveGroupPathKey.util';

import { resolveFocusedGroupPath } from './resolveFocusedGroupPath.util';

type ResolveFoldedAncestorPathKeyArgs<TData extends Record<string, unknown>> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly focusedRowKey: string | undefined;
  readonly foldedPaths: ReadonlySet<string>;
  readonly rows: readonly TData[];
};

/**
 * Which of the groups this fold just closed the focused row was sitting in — the row focus
 * lands on when the fold unmounts the one holding it.
 * A level fold names many paths at once and none of them is the focused row's by
 * construction, so the answer is read back off that row's own prefixes: the outermost one
 * the fold closed. Scanning outwards matters only if a fold ever closes two levels of the
 * same row at once; for one level there is at most one match.
 */
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
