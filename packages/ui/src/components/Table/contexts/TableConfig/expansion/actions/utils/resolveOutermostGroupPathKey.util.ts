import type { TableColumn } from '#ui/components/Table/Table.types';

import { resolveGroupPathKey } from '#ui/components/Table/contexts/TableConfig/grouping/utils/resolveGroupPathKey.util';

import { resolveFocusedGroupPath } from './resolveFocusedGroupPath.util';

type ResolveOutermostGroupPathKeyArgs<TData extends Record<string, unknown>> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly focusedRowKey: string | undefined;
  readonly rows: readonly TData[];
};

/**
 * A row's own path is what answers it, never its position, for the reason
 * `resolveGroupTreeNodes` states: rollup emits a subtotal after the rows it totals, so a
 * walk over neighbours reads the wrong group — which is why the walk itself is
 * `resolveFocusedGroupPath`, shared with the level fold rather than written twice.
 * `undefined` means focus has nowhere to fall back to and should be left alone: no row is
 * focused, the focused row is not in this list, or it is the grand total, whose path is
 * empty and which no collapse can hide (ADR-065).
 */
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
